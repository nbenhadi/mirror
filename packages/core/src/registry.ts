import type { Tool } from './types.js'

export class ToolRegistry {
  private tools = new Map<string, Tool>()

  register(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool "${tool.id}" already registered`)
    }
    this.tools.set(tool.id, tool)
  }

  get(id: string): Tool {
    const tool = this.tools.get(id)
    if (!tool) throw new Error(`Tool "${id}" not found in registry`)
    return tool
  }

  list(): Tool[] {
    return Array.from(this.tools.values())
  }

  has(id: string): boolean {
    return this.tools.has(id)
  }
}

export const registry = new ToolRegistry()
