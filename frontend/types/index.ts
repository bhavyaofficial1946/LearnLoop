export type LearningGoal = "exam_preparation" | "concept_mastery";
export type TopicDifficulty = "beginner" | "intermediate" | "advanced";

export type TopicMasteryStatus = "not_assessed" | "needs_attention" | "developing" | "strong";

export interface Student {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  is_canonical: boolean;
  created_at: string;
  canonical_topics_count?: number;
}

export interface PrerequisiteBrief {
  id: string;
  name: string;
  slug: string;
  difficulty?: TopicDifficulty;
}

export interface PrerequisiteMasteryItem {
  id: string;
  name: string;
  slug: string;
  status: TopicMasteryStatus;
  understanding_score: number;
}

export interface TopicResponse {
  id: string;
  name: string;
  slug: string;
  parent_topic_id?: string | null;
  difficulty?: TopicDifficulty;
  is_canonical: boolean;
  subtopics: TopicResponse[];
}

export interface TopicMastery {
  topic_id: string;
  topic_name: string;
  understanding_score: number;
  status: TopicMasteryStatus;
  evidence_count: number;
  correct_answers: number;
  incorrect_answers: number;
  last_assessed_at?: string | null;
}

export interface TopicDetail {
  id: string;
  name: string;
  slug: string;
  difficulty?: TopicDifficulty;
  unit_id?: string | null;
  unit_name?: string | null;
  parent_topic_id?: string | null;
  parent_topic_name?: string | null;
  prerequisites: PrerequisiteBrief[];
  dependents: PrerequisiteBrief[];
  subtopics: TopicResponse[];
  mastery?: TopicMastery | null;
  prerequisites_mastery?: PrerequisiteMasteryItem[];
}

export interface SyllabusUnitInput {
  name: string;
  order_index?: number;
  topics: string[];
}

export interface SyllabusExtractResponse {
  units: SyllabusUnitInput[];
  total_units: number;
  total_topics: number;
  source_filename?: string;
  extraction_method: string;
  warnings: string[];
}

export interface AcademicMaterial {
  id: string;
  student_subject_id: string;
  material_type: "syllabus" | "previous_year_paper";
  file_name: string;
  file_path_or_storage_reference: string;
  file_size_bytes?: number;
  status: "uploaded" | "processed" | "failed";
  created_at: string;
}

export interface WorkspaceOverview {
  id: string;
  student_id: string;
  student_name: string;
  subject_id: string;
  subject_name: string;
  goal: LearningGoal;
  exam_date?: string | null;
  days_remaining?: number | null;
  total_units: number;
  total_topics: number;
  total_materials: number;
  created_at: string;
}

export interface KnowledgeMapTopicNode {
  id: string;
  name: string;
  slug: string;
  difficulty?: TopicDifficulty;
  order_index: number;
  parent_topic_id?: string | null;
  prerequisites_count: number;
  prerequisites: string[];
  subtopics: KnowledgeMapTopicNode[];
  mastery?: TopicMastery | null;
  prerequisite_weakness_count?: number;
}

export interface KnowledgeMapUnitNode {
  id: string;
  name: string;
  order_index: number;
  topics: KnowledgeMapTopicNode[];
}

export interface KnowledgeMapResponse {
  workspace_id: string;
  subject_name: string;
  units: KnowledgeMapUnitNode[];
  total_units: number;
  total_topics: number;
}

export interface WorkspaceMasterySummary {
  workspace_id: string;
  has_baseline: boolean;
  total_topics: number;
  assessed_topics_count: number;
  strong_count: number;
  developing_count: number;
  needs_attention_count: number;
  not_assessed_count: number;
  topic_masteries: TopicMastery[];
}

export interface DiagnosticOption {
  id: string;
  option_text: string;
  order_index: number;
}

export interface DiagnosticQuestion {
  id: string;
  topic_id?: string;
  topic_name?: string;
  difficulty: TopicDifficulty;
  question_text: string;
  options: DiagnosticOption[];
}

export interface DiagnosticAssessment {
  id: string;
  student_subject_id: string;
  title: string;
  status: "in_progress" | "completed" | "abandoned";
  total_questions: number;
  answered_count: number;
  questions: DiagnosticQuestion[];
  created_at: string;
  completed_at?: string | null;
}

export interface AssessmentResultItem {
  question_id: string;
  question_text: string;
  topic_id: string;
  topic_name: string;
  difficulty: string;
  selected_option_id?: string | null;
  correct_option_id: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface TopicMasteryBrief {
  topic_id: string;
  topic_name: string;
  status: TopicMasteryStatus;
  understanding_score: number;
  evidence_count: number;
  correct_answers: number;
  incorrect_answers: number;
}

export interface AssessmentResult {
  assessment_id: string;
  status: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  score_percentage: number;
  results: AssessmentResultItem[];
  topic_masteries: TopicMasteryBrief[];
  strong_topics: string[];
  developing_topics: string[];
  needs_attention_topics: string[];
  not_assessed_topics: string[];
}

export interface WorkspaceCreatePayload {
  student_name: string;
  subject_id?: string;
  subject_name?: string;
  goal: LearningGoal;
  exam_date?: string | null;
  units: SyllabusUnitInput[];
  material_ids?: string[];
}

export interface WorkspaceCreatedResponse {
  id: string;
  student_id: string;
  student_name: string;
  subject_id: string;
  subject_name: string;
  goal: LearningGoal;
  exam_date?: string | null;
  created_at: string;
  updated_at: string;
}

