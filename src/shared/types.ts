// ============================================================
// FILE: src/shared/types.ts
// PURPOSE: All core domain types used across the Xevu pipeline.
//
// IMPORTANT — AI IDE GUIDANCE:
// This is the SINGLE SOURCE OF TRUTH for all data shapes.
// If you need a new type, add it here. Never define domain
// types inline in other files.
// ============================================================

// --- Framework Detection ---
export type Framework = 'nextjs' | 'remix' | 'vite' | 'cra' | 'gatsby' | 'unknown';

export type FileType =
  | 'component'
  | 'page'
  | 'layout'
  | 'hook'
  | 'util'
  | 'config'
  | 'style'
  | 'test'
  | 'unknown';

// --- Scanner Output ---
export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  type: FileType;
  size: number;
}

export interface ProjectStructure {
  hasPages: boolean;
  hasComponents: boolean;
  hasLayouts: boolean;
  hasHooks: boolean;
  hasStyles: boolean;
  hasTests: boolean;
  srcDir: string | null;
  entryFile: string | null;
}

export interface PackageJsonInfo {
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface ScannedProject {
  root: string;
  framework: Framework;
  files: ScannedFile[];
  packageJson: PackageJsonInfo;
  structure: ProjectStructure;
}

// --- Parser Output ---
export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
}

export interface ConditionalRender {
  condition: string;
  line: number;
}

export interface ExtractedText {
  value: string;
  source: 'jsx-text' | 'prop' | 'expression';
  propName?: string;
  componentName?: string;
  line: number;
}

export interface ComponentNode {
  name: string;
  filePath: string;
  type: 'function' | 'class' | 'forwardRef' | 'memo';
  props: PropDefinition[];
  children: string[];
  hooks: string[];
  stateVariables: string[];
  eventHandlers: string[];
  conditionalRenders: ConditionalRender[];
  texts: ExtractedText[];
  loc: { start: number; end: number };
}

export interface RouteNode {
  path: string;
  componentName: string;
  filePath: string;
  guards: string[];
  children: RouteNode[];
  isIndex: boolean;
  isLayout: boolean;
  isDynamic: boolean;
}

export interface HookUsage {
  name: string;
  componentName: string;
  filePath: string;
  arguments: string[];
}

export interface ImportEdge {
  fromFile: string;
  toFile: string;
  importedNames: string[];
}

export interface ParsedProject {
  components: ComponentNode[];
  routes: RouteNode[];
  hooks: HookUsage[];
  texts: ExtractedText[];
  imports: ImportEdge[];
  errors: ParseError[];
}

export interface ParseError {
  filePath: string;
  message: string;
  line?: number;
}

// --- Domain Detection ---
export type DomainCategory =
  | 'ecommerce'
  | 'saas'
  | 'content'
  | 'devtool'
  | 'healthcare'
  | 'general';

export interface DomainSignal {
  source: 'route' | 'component' | 'text' | 'dependency' | 'filename';
  evidence: string;
  category: DomainCategory;
  weight: number;
}

export interface DomainContext {
  primary: DomainCategory;
  confidence: number;
  signals: DomainSignal[];
  secondaryDomains: DomainCategory[];
}

// --- Flow Tracing ---
export interface UserAction {
  type: 'click' | 'submit' | 'input' | 'navigate' | 'toggle' | 'other';
  handler: string;
  element: string;
}

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  label: string | null;
}

export interface FlowNode {
  id: string;
  componentName: string;
  filePath: string;
  route?: string;
  userActions: UserAction[];
  information: string[];
  decisions: string[];
  formFields: FormField[];
  loadingStates: boolean;
  errorStates: boolean;
  emptyStates: boolean;
}

export interface FlowEdge {
  from: string;
  to: string;
  trigger: string;
  type: 'navigation' | 'conditional' | 'submit' | 'callback';
  isReversible: boolean;
}

export interface FlowGraph {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  entryPoints: string[];
  exitPoints: string[];
}

// --- Archetype Analysis ---
export type ArchetypeName =
  | 'first-timer'
  | 'goal-getter'
  | 'rusher'
  | 'skeptic'
  | 'returning-user';

export type FindingCategory =
  | 'missing-guidance'
  | 'excessive-friction'
  | 'missing-feedback'
  | 'trust-gap'
  | 'navigation-confusion'
  | 'cognitive-overload'
  | 'broken-continuity'
  | 'mobile-hostile'
  | 'missing-error-recovery';

export type Severity = 'critical' | 'major' | 'minor' | 'suggestion';

export interface CodeLocation {
  filePath: string;
  line: number;
  componentName: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  description: string;
  whyItMatters: string;
  affectedComponents: string[];
  codeLocation: CodeLocation;
  suggestion: string;
}

export interface ArchetypeFindings {
  archetype: ArchetypeName;
  flowName: string;
  findings: Finding[];
  overallScore: number;
}

// --- Report ---
export interface PipelineWarning {
  stage: string;
  message: string;
}

export interface StructuredReport {
  status: 'success' | 'partial' | 'error';
  domain: DomainContext;
  flow: FlowGraph | null;
  archetypes: ArchetypeFindings[];
  metadata: {
    filesScanned: number;
    filesSkipped: number;
    analysisTimeMs: number;
    warnings: PipelineWarning[];
    archetypesApplied: ArchetypeName[];
  };
  summary: string;
}
