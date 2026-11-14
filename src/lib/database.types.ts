// Automatisch erzeugt aus dem lokalen Supabase-Schema: npm run db:types. Nicht von Hand bearbeiten.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "crew_members": {
                  Row: {
                    "crew_id": string,"joined_at": string,"role": Database["public"]['Enums']["crew_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "crew_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["crew_role"],"user_id": string
                  }
                  Update: {
                    "crew_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["crew_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crew_members_crew_id_fkey"
      columns: ["crew_id"]
isOneToOne: false
      referencedRelation: "crews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crew_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"crews": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"invite_code": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"invite_code": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"invite_code"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crews_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"dares": {
                  Row: {
                    "created_at": string,"crew_id": string,"id": string,"owed_by": string,"owed_to": string,"quote_id": string,"settled_at": string | null,"status": Database["public"]['Enums']["dare_status"],"text": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"crew_id": string,"id"?: string,"owed_by": string,"owed_to": string,"quote_id": string,"settled_at"?: string | null,"status"?: Database["public"]['Enums']["dare_status"],"text": string
                  }
                  Update: {
                    "created_at"?: string,"crew_id"?: string,"id"?: string,"owed_by"?: string,"owed_to"?: string,"quote_id"?: string,"settled_at"?: string | null,"status"?: Database["public"]['Enums']["dare_status"],"text"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dares_crew_id_fkey"
      columns: ["crew_id"]
isOneToOne: false
      referencedRelation: "crews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dares_owed_by_fkey"
      columns: ["owed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dares_owed_to_fkey"
      columns: ["owed_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dares_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: true
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "crew_id": string,"ended_at": string | null,"id": string,"name": string,"started_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "crew_id": string,"ended_at"?: string | null,"id"?: string,"name": string,"started_at"?: string
                  }
                  Update: {
                    "crew_id"?: string,"ended_at"?: string | null,"id"?: string,"name"?: string,"started_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_crew_id_fkey"
      columns: ["crew_id"]
isOneToOne: false
      referencedRelation: "crews"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"handle": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"handle": string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"handle"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quote_picks": {
                  Row: {
                    "created_at": string,"quote_id": string,"role": Database["public"]['Enums']["quote_role"],"round_no": number,"user_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"quote_id": string,"role": Database["public"]['Enums']["quote_role"],"round_no": number,"user_id": string,"value": number
                  }
                  Update: {
                    "created_at"?: string,"quote_id"?: string,"role"?: Database["public"]['Enums']["quote_role"],"round_no"?: number,"user_id"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_picks_quote_id_round_no_fkey"
      columns: ["quote_id","round_no"]
isOneToOne: false
      referencedRelation: "quote_rounds"
      referencedColumns: ["quote_id","round_no"]
    },{
      foreignKeyName: "quote_picks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"quote_rounds": {
                  Row: {
                    "challenger_ready": boolean,"quote_id": string,"revealed_at": string | null,"round_no": number,"target_ready": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "challenger_ready"?: boolean,"quote_id": string,"revealed_at"?: string | null,"round_no": number,"target_ready"?: boolean
                  }
                  Update: {
                    "challenger_ready"?: boolean,"quote_id"?: string,"revealed_at"?: string | null,"round_no"?: number,"target_ready"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_rounds_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "challenger_id": string,"created_at": string,"crew_id": string,"current_round": number | null,"dare": string,"event_id": string | null,"expires_at": string,"hit_round": number | null,"hit_value": number | null,"id": string,"loser": Database["public"]['Enums']["quote_role"] | null,"range": number | null,"resolved_at": string | null,"status": Database["public"]['Enums']["quote_status"],"target_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "challenger_id": string,"created_at"?: string,"crew_id": string,"current_round"?: number | null,"dare": string,"event_id"?: string | null,"expires_at"?: string,"hit_round"?: number | null,"hit_value"?: number | null,"id"?: string,"loser"?: Database["public"]['Enums']["quote_role"] | null,"range"?: number | null,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"target_id": string
                  }
                  Update: {
                    "challenger_id"?: string,"created_at"?: string,"crew_id"?: string,"current_round"?: number | null,"dare"?: string,"event_id"?: string | null,"expires_at"?: string,"hit_round"?: number | null,"hit_value"?: number | null,"id"?: string,"loser"?: Database["public"]['Enums']["quote_role"] | null,"range"?: number | null,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"target_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_challenger_id_fkey"
      columns: ["challenger_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_crew_id_fkey"
      columns: ["crew_id"]
isOneToOne: false
      referencedRelation: "crews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_target_id_fkey"
      columns: ["target_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_crew":
{ Args: { "p_name": string }; Returns: {
              "created_at": string,
"created_by": string | null,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "crews"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_quote":
{ Args: { "p_crew": string,"p_dare": string,"p_target": string }; Returns: {
              "challenger_id": string,
"created_at": string,
"crew_id": string,
"current_round": number | null,
"dare": string,
"event_id": string | null,
"expires_at": string,
"hit_round": number | null,
"hit_value": number | null,
"id": string,
"loser": Database["public"]['Enums']["quote_role"] | null,
"range": number | null,
"resolved_at": string | null,
"status": Database["public"]['Enums']["quote_status"],
"target_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "quotes"
        isOneToOne: true
        isSetofReturn: false
      } },
"crew_preview":
{ Args: { "p_invite_code": string }; Returns: {
              "already_member": boolean,"crew_id": string,"member_count": number,"name": string
            }[]
                           },
"decline_quote":
{ Args: { "p_quote": string }; Returns: {
              "challenger_id": string,
"created_at": string,
"crew_id": string,
"current_round": number | null,
"dare": string,
"event_id": string | null,
"expires_at": string,
"hit_round": number | null,
"hit_value": number | null,
"id": string,
"loser": Database["public"]['Enums']["quote_role"] | null,
"range": number | null,
"resolved_at": string | null,
"status": Database["public"]['Enums']["quote_status"],
"target_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "quotes"
        isOneToOne: true
        isSetofReturn: false
      } },
"end_event":
{ Args: { "p_event": string }; Returns: {
              "crew_id": string,
"ended_at": string | null,
"id": string,
"name": string,
"started_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "events"
        isOneToOne: true
        isSetofReturn: false
      } },
"expire_stale_quotes":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"fail":
{ Args: { "code": string,"detail"?: string }; Returns: undefined
                           },
"is_crew_member":
{ Args: { "p_crew": string }; Returns: boolean
                           },
"join_crew":
{ Args: { "p_invite_code": string }; Returns: {
              "created_at": string,
"created_by": string | null,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "crews"
        isOneToOne: true
        isSetofReturn: false
      } },
"leave_crew":
{ Args: { "p_crew": string }; Returns: undefined
                           },
"lock_open_quote":
{ Args: { "p_quote": string }; Returns: {
              "challenger_id": string,
"created_at": string,
"crew_id": string,
"current_round": number | null,
"dare": string,
"event_id": string | null,
"expires_at": string,
"hit_round": number | null,
"hit_value": number | null,
"id": string,
"loser": Database["public"]['Enums']["quote_role"] | null,
"range": number | null,
"resolved_at": string | null,
"status": Database["public"]['Enums']["quote_status"],
"target_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "quotes"
        isOneToOne: true
        isSetofReturn: false
      } },
"new_invite_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"require_user":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"set_handle":
{ Args: { "p_handle": string }; Returns: {
              "created_at": string,
"handle": string,
"id": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"set_range":
{ Args: { "p_quote": string,"p_range": number }; Returns: {
              "challenger_id": string,
"created_at": string,
"crew_id": string,
"current_round": number | null,
"dare": string,
"event_id": string | null,
"expires_at": string,
"hit_round": number | null,
"hit_value": number | null,
"id": string,
"loser": Database["public"]['Enums']["quote_role"] | null,
"range": number | null,
"resolved_at": string | null,
"status": Database["public"]['Enums']["quote_status"],
"target_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "quotes"
        isOneToOne: true
        isSetofReturn: false
      } },
"settle_dare":
{ Args: { "p_action": string,"p_dare": string }; Returns: {
              "created_at": string,
"crew_id": string,
"id": string,
"owed_by": string,
"owed_to": string,
"quote_id": string,
"settled_at": string | null,
"status": Database["public"]['Enums']["dare_status"],
"text": string
            }
                          SetofOptions: {
        from: "*"
        to: "dares"
        isOneToOne: true
        isSetofReturn: false
      } },
"shares_crew_with":
{ Args: { "p_user": string }; Returns: boolean
                           },
"start_event":
{ Args: { "p_crew": string,"p_name": string }; Returns: {
              "crew_id": string,
"ended_at": string | null,
"id": string,
"name": string,
"started_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "events"
        isOneToOne: true
        isSetofReturn: false
      } },
"submit_pick":
{ Args: { "p_quote": string,"p_value": number }; Returns: {
              "challenger_id": string,
"created_at": string,
"crew_id": string,
"current_round": number | null,
"dare": string,
"event_id": string | null,
"expires_at": string,
"hit_round": number | null,
"hit_value": number | null,
"id": string,
"loser": Database["public"]['Enums']["quote_role"] | null,
"range": number | null,
"resolved_at": string | null,
"status": Database["public"]['Enums']["quote_status"],
"target_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "quotes"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "crew_role": "owner"|"member","dare_status": "open"|"done"|"vetoed","quote_role": "challenger"|"target","quote_status": "awaiting_range"|"picking"|"resolved"|"declined"|"expired"
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
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "crew_role": ["owner", "member"],"dare_status": ["open", "done", "vetoed"],"quote_role": ["challenger", "target"],"quote_status": ["awaiting_range", "picking", "resolved", "declined", "expired"]
          }
        }
} as const
