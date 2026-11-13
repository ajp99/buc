
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "announcements": {
                  Row: {
                    "body": string,"created_at": string,"created_by": string | null,"id": string,"target_batch_id": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"target_batch_id"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"target_batch_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcements_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcements_target_batch_id_fkey"
      columns: ["target_batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity": string,"entity_id": string | null,"id": number,"meta": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity": string,"entity_id"?: string | null,"id"?: never,"meta"?: NonNullable<Json>
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"id"?: never,"meta"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"batches": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"standard": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"standard": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"standard"?: number
                  }
                  Relationships: [
                    
                  ]
                },"enquiries": {
                  Row: {
                    "created_at": string,"id": string,"message": string,"name": string,"phone": string,"standard": number,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string,"name": string,"phone": string,"standard": number,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string,"name"?: string,"phone"?: string,"standard"?: number,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fees": {
                  Row: {
                    "amount": number,"created_at": string,"id": string,"marked_by": string | null,"month": string,"paid_at": string | null,"receipt_no": string | null,"status": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"id"?: string,"marked_by"?: string | null,"month": string,"paid_at"?: string | null,"receipt_no"?: string | null,"status"?: string,"student_id": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"id"?: string,"marked_by"?: string | null,"month"?: string,"paid_at"?: string | null,"receipt_no"?: string | null,"status"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fees_marked_by_fkey"
      columns: ["marked_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fees_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"homework": {
                  Row: {
                    "batch_id": string,"created_at": string,"created_by": string | null,"description": string,"due_date": string,"id": string,"subject_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string,"created_by"?: string | null,"description"?: string,"due_date": string,"id"?: string,"subject_id": string,"title": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string,"due_date"?: string,"id"?: string,"subject_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "homework_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "homework_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "homework_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    }
                  ]
                },"materials": {
                  Row: {
                    "batch_id": string,"created_at": string,"created_by": string | null,"id": string,"subject_id": string,"title": string,"type": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"subject_id": string,"title": string,"type": string,"url": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"subject_id"?: string,"title"?: string,"type"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "materials_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "materials_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "materials_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_attempts": {
                  Row: {
                    "answers": NonNullable<Json>,"id": string,"quiz_id": string,"score": number,"student_id": string,"submitted_at": string,"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers": NonNullable<Json>,"id"?: string,"quiz_id": string,"score": number,"student_id": string,"submitted_at"?: string,"total": number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"id"?: string,"quiz_id"?: string,"score"?: number,"student_id"?: string,"submitted_at"?: string,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_attempts_quiz_id_fkey"
      columns: ["quiz_id"]
isOneToOne: false
      referencedRelation: "quizzes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_attempts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_questions": {
                  Row: {
                    "correct_option": number,"id": string,"marks": number,"options": NonNullable<Json>,"position": number,"question_text": string,"quiz_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "correct_option": number,"id"?: string,"marks"?: number,"options": NonNullable<Json>,"position"?: number,"question_text": string,"quiz_id": string
                  }
                  Update: {
                    "correct_option"?: number,"id"?: string,"marks"?: number,"options"?: NonNullable<Json>,"position"?: number,"question_text"?: string,"quiz_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_questions_quiz_id_fkey"
      columns: ["quiz_id"]
isOneToOne: false
      referencedRelation: "quizzes"
      referencedColumns: ["id"]
    }
                  ]
                },"quizzes": {
                  Row: {
                    "batch_id": string,"closes_at": string,"created_at": string,"created_by": string | null,"description": string,"id": string,"opens_at": string,"show_answers_after_submit": boolean,"subject_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"closes_at": string,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"opens_at": string,"show_answers_after_submit"?: boolean,"subject_id": string,"title": string
                  }
                  Update: {
                    "batch_id"?: string,"closes_at"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"opens_at"?: string,"show_answers_after_submit"?: boolean,"subject_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quizzes_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quizzes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quizzes_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    }
                  ]
                },"receipt_counters": {
                  Row: {
                    "last_no": number,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "last_no": number,"year": number
                  }
                  Update: {
                    "last_no"?: number,"year"?: number
                  }
                  Relationships: [
                    
                  ]
                },"students": {
                  Row: {
                    "batch_id": string,"created_at": string,"deleted_at": string | null,"full_name": string,"id": string,"is_active": boolean,"monthly_fee": number,"parent_phone": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string,"deleted_at"?: string | null,"full_name": string,"id"?: string,"is_active"?: boolean,"monthly_fee"?: number,"parent_phone": string,"user_id": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: boolean,"monthly_fee"?: number,"parent_phone"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "students_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "students_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"subjects": {
                  Row: {
                    "batch_id": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"id"?: string,"name": string
                  }
                  Update: {
                    "batch_id"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subjects_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "created_at": string,"id": string,"language": string,"phone": string | null,"role": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"language"?: string,"phone"?: string | null,"role"?: string,"username"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"language"?: string,"phone"?: string | null,"role"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_role_name":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"generate_fees":
{ Args: { "p_month": string }; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_fee_paid":
{ Args: { "p_fee_id": string }; Returns: {
              "amount": number,
"created_at": string,
"id": string,
"marked_by": string | null,
"month": string,
"paid_at": string | null,
"receipt_no": string | null,
"status": string,
"student_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "fees"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_fee_unpaid":
{ Args: { "p_fee_id": string }; Returns: {
              "amount": number,
"created_at": string,
"id": string,
"marked_by": string | null,
"month": string,
"paid_at": string | null,
"receipt_no": string | null,
"status": string,
"student_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "fees"
        isOneToOne: true
        isSetofReturn: false
      } },
"my_batch_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_student_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"quiz_questions_for_student":
{ Args: { "p_quiz_id": string }; Returns: {
              "id": string,"marks": number,"options": Json,"position": number,"question_text": string
            }[]
                           },
"quiz_review":
{ Args: { "p_quiz_id": string }; Returns: {
              "chosen_option": number,"correct_option": number,"id": string,"marks": number,"options": Json,"position": number,"question_text": string
            }[]
                           },
"submit_quiz":
{ Args: { "p_answers": Json,"p_quiz_id": string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
