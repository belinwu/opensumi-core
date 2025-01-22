import { Autowired, Injectable } from '@opensumi/di';

import { MCPServerDescription, MCPServerManager, MCPTool } from '../common/mcp-server-manager';
import { ToolInvocationRegistry, ToolInvocationRegistryImpl, ToolRequest } from '../common/tool-invocation-registry';

import { BuiltinMCPServer, TokenBuiltinMCPServer } from './mcp/sumi-mcp-server';
import { IMCPServer, MCPServerImpl } from './mcp-server';

@Injectable()
export class MCPServerManagerImpl implements MCPServerManager {
  @Autowired(ToolInvocationRegistry)
  private readonly toolInvocationRegistry: ToolInvocationRegistryImpl;

    @Autowired(TokenBuiltinMCPServer)
    private readonly builtinMCPServer: BuiltinMCPServer;

    protected servers: Map<string, IMCPServer> = new Map();

  async stopServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP server "${serverName}" not found.`);
    }
    server.stop();
    console.log(`MCP server "${serverName}" stopped.`);
  }

  async getStartedServers(): Promise<string[]> {
    const startedServers: string[] = [];
    for (const [name, server] of this.servers.entries()) {
      if (server.isStarted()) {
        startedServers.push(name);
      }
    }
    return startedServers;
  }

    callTool(serverName: string, toolName: string, arg_string: string): ReturnType<IMCPServer['callTool']> {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(`MCP server "${toolName}" not found.`);
        }
        return server.callTool(toolName, arg_string);
    }

  async startServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP server "${serverName}" not found.`);
    }
    await server.start();
  }

  async getServerNames(): Promise<string[]> {
    return Array.from(this.servers.keys());
  }

  private convertToToolRequest(tool: MCPTool, serverName: string): ToolRequest {
    const id = `mcp_${serverName}_${tool.name}`;

    return {
      id,
      name: id,
      providerName: `mcp_${serverName}`,
      parameters: tool.inputSchema,
      description: tool.description,
      handler: async (arg_string: string) => {
        try {
          const res = await this.callTool(serverName, tool.name, arg_string);
          console.log(`[MCP: ${serverName}] ${tool.name} called with ${arg_string}`);
          console.log(res);
          return JSON.stringify(res);
        } catch (error) {
          console.error(`Error in tool handler for ${tool.name} on MCP server ${serverName}:`, error);
          throw error;
        }
      },
    };
  }

  public async collectTools(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP server "${serverName}" not found.`);
    }

    const { tools } = await server.getTools();
    const toolRequests: ToolRequest[] = tools.map((tool) => this.convertToToolRequest(tool, serverName));

    for (const toolRequest of toolRequests) {
      this.toolInvocationRegistry.registerTool(toolRequest);
    }
  }

    public async getTools(serverName: string): ReturnType<IMCPServer['getTools']> {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(`MCP server "${serverName}" not found.`);
        }
        return server.getTools();

    }

  addOrUpdateServer(description: MCPServerDescription): void {
    const { name, command, args, env } = description;
    const existingServer = this.servers.get(name);

        if (existingServer) {
            existingServer.update(command, args, env);
        } else {
            const newServer = new MCPServerImpl(name, command, args, env);
            this.servers.set(name, newServer);
        }
    }

    addOrUpdateServerDirectly(server: IMCPServer): void {
        this.servers.set(server.getServerName(), server);
    }

    initBuiltinServer(): void {
        this.addOrUpdateServerDirectly(this.builtinMCPServer);
        this.collectTools(this.builtinMCPServer.getServerName());
    }

  removeServer(name: string): void {
    const server = this.servers.get(name);
    if (server) {
      server.stop();
      this.servers.delete(name);
    } else {
      console.warn(`MCP server "${name}" not found.`);
    }
  }
}
