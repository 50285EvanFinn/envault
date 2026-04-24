export interface TemplateVariable {
  key: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Template {
  name: string;
  description?: string;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStore {
  templates: Record<string, Template>;
}

export function createEmptyTemplateStore(): TemplateStore {
  return { templates: {} };
}

export function createTemplate(
  name: string,
  variables: TemplateVariable[],
  description?: string
): Template {
  const now = new Date().toISOString();
  return { name, description, variables, createdAt: now, updatedAt: now };
}

export function addTemplate(store: TemplateStore, template: Template): TemplateStore {
  return {
    ...store,
    templates: { ...store.templates, [template.name]: template },
  };
}

export function removeTemplate(store: TemplateStore, name: string): TemplateStore {
  const { [name]: _, ...rest } = store.templates;
  return { ...store, templates: rest };
}

export function getTemplate(store: TemplateStore, name: string): Template | undefined {
  return store.templates[name];
}

export function listTemplates(store: TemplateStore): Template[] {
  return Object.values(store.templates);
}

export function validateAgainstTemplate(
  template: Template,
  entries: Record<string, string>
): string[] {
  const missing: string[] = [];
  for (const variable of template.variables) {
    if (variable.required && !(variable.key in entries) && variable.defaultValue === undefined) {
      missing.push(variable.key);
    }
  }
  return missing;
}

export function applyTemplateDefaults(
  template: Template,
  entries: Record<string, string>
): Record<string, string> {
  const result = { ...entries };
  for (const variable of template.variables) {
    if (!(variable.key in result) && variable.defaultValue !== undefined) {
      result[variable.key] = variable.defaultValue;
    }
  }
  return result;
}
