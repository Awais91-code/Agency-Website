export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar_url: string | null; timezone: string | null; locale: string; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; avatar_url?: string | null; timezone?: string | null; locale?: string; created_at?: string; updated_at?: string };
        Update: { display_name?: string | null; avatar_url?: string | null; timezone?: string | null; locale?: string; updated_at?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role: Database["public"]["Enums"]["app_role"]; assigned_by: string | null; assigned_at: string };
        Insert: { user_id: string; role?: Database["public"]["Enums"]["app_role"]; assigned_by?: string | null; assigned_at?: string };
        Update: { role?: Database["public"]["Enums"]["app_role"]; assigned_by?: string | null; assigned_at?: string };
        Relationships: [];
      };
      user_invitations: {
        Row: { id: string; email: string; normalized_email: string; role: Database["public"]["Enums"]["app_role"]; invited_by: string | null; auth_user_id: string | null; status: Database["public"]["Enums"]["invitation_status"]; invited_at: string; accepted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; email: string; role: Database["public"]["Enums"]["app_role"]; invited_by?: string | null; auth_user_id?: string | null; status?: Database["public"]["Enums"]["invitation_status"]; invited_at?: string; accepted_at?: string | null; created_at?: string; updated_at?: string };
        Update: { email?: string; role?: Database["public"]["Enums"]["app_role"]; invited_by?: string | null; auth_user_id?: string | null; status?: Database["public"]["Enums"]["invitation_status"]; invited_at?: string; accepted_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      leads: {
        Row: { id: string; full_name: string | null; email: string | null; normalized_email: string | null; company_name: string | null; source: string | null; status: Database["public"]["Enums"]["lead_status"]; owner_user_id: string | null; priority: Database["public"]["Enums"]["lead_priority"]; lead_score: number; score_reasons: Json; next_action: string | null; next_action_at: string | null; last_contacted_at: string | null; lost_reason: string | null; attribution_source: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_term: string | null; utm_content: string | null; landing_path: string | null; initial_referrer_host: string | null; attribution_captured_at: string | null; metadata: Json; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; full_name?: string | null; email?: string | null; company_name?: string | null; source?: string | null; status?: Database["public"]["Enums"]["lead_status"]; owner_user_id?: string | null; priority?: Database["public"]["Enums"]["lead_priority"]; lead_score?: number; score_reasons?: Json; next_action?: string | null; next_action_at?: string | null; last_contacted_at?: string | null; lost_reason?: string | null; attribution_source?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_term?: string | null; utm_content?: string | null; landing_path?: string | null; initial_referrer_host?: string | null; attribution_captured_at?: string | null; metadata?: Json; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { full_name?: string | null; email?: string | null; company_name?: string | null; source?: string | null; status?: Database["public"]["Enums"]["lead_status"]; owner_user_id?: string | null; priority?: Database["public"]["Enums"]["lead_priority"]; lead_score?: number; score_reasons?: Json; next_action?: string | null; next_action_at?: string | null; last_contacted_at?: string | null; lost_reason?: string | null; attribution_source?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_term?: string | null; utm_content?: string | null; landing_path?: string | null; initial_referrer_host?: string | null; attribution_captured_at?: string | null; metadata?: Json; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      lead_notes: {
        Row: { id: string; lead_id: string; author_user_id: string | null; body: string; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; lead_id: string; author_user_id?: string | null; body: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { body?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      lead_stage_history: {
        Row: { id: string; lead_id: string; from_status: Database["public"]["Enums"]["lead_status"] | null; to_status: Database["public"]["Enums"]["lead_status"]; changed_by: string | null; reason: string | null; created_at: string };
        Insert: { id?: string; lead_id: string; from_status?: Database["public"]["Enums"]["lead_status"] | null; to_status: Database["public"]["Enums"]["lead_status"]; changed_by?: string | null; reason?: string | null; created_at?: string };
        Update: { reason?: string | null };
        Relationships: [];
      };
      lead_tasks: {
        Row: { id: string; lead_id: string; title: string; due_at: string | null; assigned_to: string | null; created_by: string | null; completed_at: string | null; completed_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; lead_id: string; title: string; due_at?: string | null; assigned_to?: string | null; created_by?: string | null; completed_at?: string | null; completed_by?: string | null; created_at?: string; updated_at?: string };
        Update: { title?: string; due_at?: string | null; assigned_to?: string | null; completed_at?: string | null; completed_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      lead_tags: {
        Row: { id: string; name: string; normalized_name: string; created_by: string | null; created_at: string };
        Insert: { id?: string; name: string; created_by?: string | null; created_at?: string };
        Update: { name?: string };
        Relationships: [];
      };
      lead_tag_links: {
        Row: { lead_id: string; tag_id: string; created_by: string | null; created_at: string };
        Insert: { lead_id: string; tag_id: string; created_by?: string | null; created_at?: string };
        Update: { created_by?: string | null };
        Relationships: [];
      };
      projects: {
        Row: { id: string; lead_id: string | null; name: string; status: Database["public"]["Enums"]["project_status"]; metadata: Json; summary: string | null; client_status_label: string | null; start_date: string | null; target_date: string | null; next_action: string | null; next_action_at: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; lead_id?: string | null; name: string; status?: Database["public"]["Enums"]["project_status"]; metadata?: Json; summary?: string | null; client_status_label?: string | null; start_date?: string | null; target_date?: string | null; next_action?: string | null; next_action_at?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { lead_id?: string | null; name?: string; status?: Database["public"]["Enums"]["project_status"]; metadata?: Json; summary?: string | null; client_status_label?: string | null; start_date?: string | null; target_date?: string | null; next_action?: string | null; next_action_at?: string | null; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      content_records: {
        Row: { id: string; content_type: string; slug: string; title: string; status: Database["public"]["Enums"]["content_status"]; metadata: Json; created_at: string; updated_at: string; published_at: string | null; archived_at: string | null };
        Insert: { id?: string; content_type: string; slug: string; title: string; status?: Database["public"]["Enums"]["content_status"]; metadata?: Json; created_at?: string; updated_at?: string; published_at?: string | null; archived_at?: string | null };
        Update: { content_type?: string; slug?: string; title?: string; status?: Database["public"]["Enums"]["content_status"]; metadata?: Json; updated_at?: string; published_at?: string | null; archived_at?: string | null };
        Relationships: [];
      };
      analytics_events: {
        Row: { id: string; event_key: string; event_name: Database["public"]["Enums"]["analytics_event_name"]; environment: string; source: string; session_id: string | null; lead_id: string | null; entity_type: string | null; entity_id: string | null; path: string | null; referrer_host: string | null; attribution: Json; properties: Json; occurred_at: string; created_at: string };
        Insert: { id?: string; event_key: string; event_name: Database["public"]["Enums"]["analytics_event_name"]; environment: string; source?: string; session_id?: string | null; lead_id?: string | null; entity_type?: string | null; entity_id?: string | null; path?: string | null; referrer_host?: string | null; attribution?: Json; properties?: Json; occurred_at?: string; created_at?: string };
        Update: { event_key?: string; event_name?: Database["public"]["Enums"]["analytics_event_name"]; environment?: string; source?: string; session_id?: string | null; lead_id?: string | null; entity_type?: string | null; entity_id?: string | null; path?: string | null; referrer_host?: string | null; attribution?: Json; properties?: Json; occurred_at?: string };
        Relationships: [];
      };
      activity_events: {
        Row: { id: number; event_id: string; entity_type: string; entity_id: string; event_type: string; actor_user_id: string | null; source: string; metadata: Json; occurred_at: string };
        Insert: { id?: number; event_id?: string; entity_type: string; entity_id: string; event_type: string; actor_user_id?: string | null; source?: string; metadata?: Json; occurred_at?: string };
        Update: { event_id?: string; entity_type?: string; entity_id?: string; event_type?: string; actor_user_id?: string | null; source?: string; metadata?: Json; occurred_at?: string };
        Relationships: [];
      };
      media_assets: {
        Row: { id: string; bucket: string; object_path: string; original_name: string; display_name: string; mime_type: string; size_bytes: number; width: number | null; height: number | null; alt_text: string | null; caption: string | null; visibility: Database["public"]["Enums"]["media_visibility"]; uploaded_by: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; bucket: string; object_path: string; original_name: string; display_name: string; mime_type: string; size_bytes: number; width?: number | null; height?: number | null; alt_text?: string | null; caption?: string | null; visibility: Database["public"]["Enums"]["media_visibility"]; uploaded_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { display_name?: string; alt_text?: string | null; caption?: string | null; width?: number | null; height?: number | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      file_references: {
        Row: { id: string; media_asset_id: string; entity_type: string; entity_id: string; relation_key: string; is_client_visible: boolean; created_by: string | null; created_at: string };
        Insert: { id?: string; media_asset_id: string; entity_type: string; entity_id: string; relation_key?: string; is_client_visible?: boolean; created_by?: string | null; created_at?: string };
        Update: { relation_key?: string; is_client_visible?: boolean };
        Relationships: [];
      };
      file_access_grants: {
        Row: { id: string; media_asset_id: string; user_id: string; granted_by: string | null; created_at: string };
        Insert: { id?: string; media_asset_id: string; user_id: string; granted_by?: string | null; created_at?: string };
        Update: { granted_by?: string | null };
        Relationships: [];
      };
      services: {
        Row: { id: string; slug: string; title: string; eyebrow: string | null; short_description: string; hero_title: string; hero_description: string; problems: string[]; deliverables: string[]; outcomes: string[]; process_steps: Json; technologies: string[]; pricing_note: string | null; cta_label: string; cta_href: string; seo_title: string | null; seo_description: string | null; hero_media_id: string | null; related_case_study_slugs: string[]; status: Database["public"]["Enums"]["content_status"]; is_featured: boolean; sort_order: number; published_at: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; slug: string; title: string; eyebrow?: string | null; short_description: string; hero_title: string; hero_description: string; problems?: string[]; deliverables?: string[]; outcomes?: string[]; process_steps?: Json; technologies?: string[]; pricing_note?: string | null; cta_label?: string; cta_href?: string; seo_title?: string | null; seo_description?: string | null; hero_media_id?: string | null; related_case_study_slugs?: string[]; status?: Database["public"]["Enums"]["content_status"]; is_featured?: boolean; sort_order?: number; published_at?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { slug?: string; title?: string; eyebrow?: string | null; short_description?: string; hero_title?: string; hero_description?: string; problems?: string[]; deliverables?: string[]; outcomes?: string[]; process_steps?: Json; technologies?: string[]; pricing_note?: string | null; cta_label?: string; cta_href?: string; seo_title?: string | null; seo_description?: string | null; hero_media_id?: string | null; related_case_study_slugs?: string[]; status?: Database["public"]["Enums"]["content_status"]; is_featured?: boolean; sort_order?: number; published_at?: string | null; updated_by?: string | null; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      service_faqs: {
        Row: { id: string; service_id: string; question: string; answer: string; sort_order: number; visible: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; service_id: string; question: string; answer: string; sort_order?: number; visible?: boolean; created_at?: string; updated_at?: string };
        Update: { question?: string; answer?: string; sort_order?: number; visible?: boolean; updated_at?: string };
        Relationships: [];
      };
      service_relations: {
        Row: { service_id: string; related_service_id: string; sort_order: number; created_at: string };
        Insert: { service_id: string; related_service_id: string; sort_order?: number; created_at?: string };
        Update: { sort_order?: number };
        Relationships: [];
      };
      case_studies: {
        Row: { id: string; slug: string; title: string; project_label: string; client_name: string | null; industry: string | null; short_description: string; hero_title: string; hero_description: string; problem: string; approach: string; solution: string; result_summary: string; technologies: string[]; tags: string[]; testimonial_quote: string | null; testimonial_attribution: string | null; testimonial_approved: boolean; cta_label: string; cta_href: string; seo_title: string | null; seo_description: string | null; hero_media_id: string | null; status: Database["public"]["Enums"]["content_status"]; is_featured: boolean; sort_order: number; published_at: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; slug: string; title: string; project_label?: string; client_name?: string | null; industry?: string | null; short_description: string; hero_title: string; hero_description: string; problem: string; approach: string; solution: string; result_summary: string; technologies?: string[]; tags?: string[]; testimonial_quote?: string | null; testimonial_attribution?: string | null; testimonial_approved?: boolean; cta_label?: string; cta_href?: string; seo_title?: string | null; seo_description?: string | null; hero_media_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; is_featured?: boolean; sort_order?: number; published_at?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { slug?: string; title?: string; project_label?: string; client_name?: string | null; industry?: string | null; short_description?: string; hero_title?: string; hero_description?: string; problem?: string; approach?: string; solution?: string; result_summary?: string; technologies?: string[]; tags?: string[]; testimonial_quote?: string | null; testimonial_attribution?: string | null; testimonial_approved?: boolean; cta_label?: string; cta_href?: string; seo_title?: string | null; seo_description?: string | null; hero_media_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; is_featured?: boolean; sort_order?: number; published_at?: string | null; updated_by?: string | null; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      case_study_services: {
        Row: { case_study_id: string; service_id: string; sort_order: number; created_at: string };
        Insert: { case_study_id: string; service_id: string; sort_order?: number; created_at?: string };
        Update: { sort_order?: number };
        Relationships: [];
      };
      case_study_media: {
        Row: { id: string; case_study_id: string; media_asset_id: string; alt_text_override: string | null; caption: string | null; sort_order: number; visible: boolean; created_at: string };
        Insert: { id?: string; case_study_id: string; media_asset_id: string; alt_text_override?: string | null; caption?: string | null; sort_order?: number; visible?: boolean; created_at?: string };
        Update: { alt_text_override?: string | null; caption?: string | null; sort_order?: number; visible?: boolean };
        Relationships: [];
      };
      case_study_metrics: {
        Row: { id: string; case_study_id: string; value: string; label: string; context: string | null; is_approved: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; case_study_id: string; value: string; label: string; context?: string | null; is_approved?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { value?: string; label?: string; context?: string | null; is_approved?: boolean; sort_order?: number; updated_at?: string };
        Relationships: [];
      };
      project_members: {
        Row: { id: string; project_id: string; user_id: string; member_role: Database["public"]["Enums"]["project_member_role"]; is_active: boolean; invited_by: string | null; joined_at: string; created_at: string };
        Insert: { id?: string; project_id: string; user_id: string; member_role?: Database["public"]["Enums"]["project_member_role"]; is_active?: boolean; invited_by?: string | null; joined_at?: string; created_at?: string };
        Update: { member_role?: Database["public"]["Enums"]["project_member_role"]; is_active?: boolean; invited_by?: string | null; joined_at?: string };
        Relationships: [];
      };
      milestones: {
        Row: { id: string; project_id: string; title: string; description: string; status: Database["public"]["Enums"]["milestone_status"]; due_at: string | null; completed_at: string | null; sort_order: number; client_visible: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id: string; title: string; description?: string; status?: Database["public"]["Enums"]["milestone_status"]; due_at?: string | null; completed_at?: string | null; sort_order?: number; client_visible?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { title?: string; description?: string; status?: Database["public"]["Enums"]["milestone_status"]; due_at?: string | null; completed_at?: string | null; sort_order?: number; client_visible?: boolean; updated_at?: string };
        Relationships: [];
      };
      project_files: {
        Row: { id: string; project_id: string; media_asset_id: string; category: string; description: string; client_visible: boolean; uploaded_by: string | null; created_at: string };
        Insert: { id?: string; project_id: string; media_asset_id: string; category?: string; description?: string; client_visible?: boolean; uploaded_by?: string | null; created_at?: string };
        Update: { category?: string; description?: string; client_visible?: boolean };
        Relationships: [];
      };
      client_requests: {
        Row: { id: string; project_id: string; created_by: string; request_type: Database["public"]["Enums"]["client_request_type"]; title: string; description: string; status: Database["public"]["Enums"]["client_request_status"]; priority: string; staff_response: string | null; resolved_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id: string; created_by: string; request_type?: Database["public"]["Enums"]["client_request_type"]; title: string; description: string; status?: Database["public"]["Enums"]["client_request_status"]; priority?: string; staff_response?: string | null; resolved_at?: string | null; created_at?: string; updated_at?: string };
        Update: { request_type?: Database["public"]["Enums"]["client_request_type"]; title?: string; description?: string; status?: Database["public"]["Enums"]["client_request_status"]; priority?: string; staff_response?: string | null; resolved_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      client_request_comments: {
        Row: { id: string; request_id: string; author_user_id: string; body: string; is_internal: boolean; created_at: string };
        Insert: { id?: string; request_id: string; author_user_id: string; body: string; is_internal?: boolean; created_at?: string };
        Update: { body?: string; is_internal?: boolean };
        Relationships: [];
      };
      approvals: {
        Row: { id: string; project_id: string; title: string; description: string; status: Database["public"]["Enums"]["approval_status"]; client_visible: boolean; requested_by: string | null; decided_by: string | null; due_at: string | null; decided_at: string | null; decision_note: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id: string; title: string; description?: string; status?: Database["public"]["Enums"]["approval_status"]; client_visible?: boolean; requested_by?: string | null; decided_by?: string | null; due_at?: string | null; decided_at?: string | null; decision_note?: string | null; created_at?: string; updated_at?: string };
        Update: { title?: string; description?: string; status?: Database["public"]["Enums"]["approval_status"]; client_visible?: boolean; decided_by?: string | null; due_at?: string | null; decided_at?: string | null; decision_note?: string | null; updated_at?: string };
        Relationships: [];
      };
      project_activities: {
        Row: { id: number; project_id: string; event_type: string; summary: string; actor_user_id: string | null; client_visible: boolean; metadata: Json; created_at: string };
        Insert: { id?: number; project_id: string; event_type: string; summary: string; actor_user_id?: string | null; client_visible?: boolean; metadata?: Json; created_at?: string };
        Update: { summary?: string; client_visible?: boolean; metadata?: Json };
        Relationships: [];
      };
      blog_authors: {
        Row: { id: string; slug: string; display_name: string; bio: string; job_title: string | null; avatar_media_id: string | null; is_active: boolean; sort_order: number; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; display_name: string; bio?: string; job_title?: string | null; avatar_media_id?: string | null; is_active?: boolean; sort_order?: number; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { slug?: string; display_name?: string; bio?: string; job_title?: string | null; avatar_media_id?: string | null; is_active?: boolean; sort_order?: number; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      blog_categories: {
        Row: { id: string; slug: string; name: string; description: string; seo_title: string | null; seo_description: string | null; is_active: boolean; sort_order: number; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; description?: string; seo_title?: string | null; seo_description?: string | null; is_active?: boolean; sort_order?: number; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { slug?: string; name?: string; description?: string; seo_title?: string | null; seo_description?: string | null; is_active?: boolean; sort_order?: number; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      blog_tags: {
        Row: { id: string; slug: string; name: string; description: string; is_active: boolean; sort_order: number; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; description?: string; is_active?: boolean; sort_order?: number; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { slug?: string; name?: string; description?: string; is_active?: boolean; sort_order?: number; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      blog_posts: {
        Row: { id: string; slug: string; title: string; excerpt: string; body_markdown: string; author_id: string | null; category_id: string | null; cover_media_id: string | null; status: Database["public"]["Enums"]["content_status"]; is_featured: boolean; sort_order: number; published_at: string | null; seo_title: string | null; seo_description: string | null; canonical_url: string | null; og_title: string | null; og_description: string | null; social_image_media_id: string | null; created_by: string | null; updated_by: string | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; title: string; excerpt: string; body_markdown: string; author_id?: string | null; category_id?: string | null; cover_media_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; is_featured?: boolean; sort_order?: number; published_at?: string | null; seo_title?: string | null; seo_description?: string | null; canonical_url?: string | null; og_title?: string | null; og_description?: string | null; social_image_media_id?: string | null; created_by?: string | null; updated_by?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { slug?: string; title?: string; excerpt?: string; body_markdown?: string; author_id?: string | null; category_id?: string | null; cover_media_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; is_featured?: boolean; sort_order?: number; published_at?: string | null; seo_title?: string | null; seo_description?: string | null; canonical_url?: string | null; og_title?: string | null; og_description?: string | null; social_image_media_id?: string | null; updated_by?: string | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      blog_post_tags: {
        Row: { post_id: string; tag_id: string; sort_order: number; created_at: string };
        Insert: { post_id: string; tag_id: string; sort_order?: number; created_at?: string };
        Update: { sort_order?: number };
        Relationships: [];
      };
      blog_post_services: {
        Row: { post_id: string; service_id: string; sort_order: number; created_at: string };
        Insert: { post_id: string; service_id: string; sort_order?: number; created_at?: string };
        Update: { sort_order?: number };
        Relationships: [];
      };
      blog_post_case_studies: {
        Row: { post_id: string; case_study_id: string; sort_order: number; created_at: string };
        Insert: { post_id: string; case_study_id: string; sort_order?: number; created_at?: string };
        Update: { sort_order?: number };
        Relationships: [];
      };
      seo_redirects: {
        Row: { id: string; source_path: string; destination_path: string; status_code: number; is_active: boolean; reason: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; source_path: string; destination_path: string; status_code?: number; is_active?: boolean; reason?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { source_path?: string; destination_path?: string; status_code?: number; is_active?: boolean; reason?: string | null; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      ai_settings: {
        Row: { id: string; assistant_enabled: boolean; provider: string; model: string; prompt_version: string; logging_enabled: boolean; review_enabled: boolean; retention_days: number; max_messages_per_conversation: number; rate_limit_per_10m: number; handoff_label: string; handoff_href: string; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; assistant_enabled?: boolean; provider?: string; model?: string; prompt_version?: string; logging_enabled?: boolean; review_enabled?: boolean; retention_days?: number; max_messages_per_conversation?: number; rate_limit_per_10m?: number; handoff_label?: string; handoff_href?: string; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { assistant_enabled?: boolean; provider?: string; model?: string; prompt_version?: string; logging_enabled?: boolean; review_enabled?: boolean; retention_days?: number; max_messages_per_conversation?: number; rate_limit_per_10m?: number; handoff_label?: string; handoff_href?: string; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      ai_conversations: {
        Row: { id: string; session_token_hash: string; requester_hash: string; status: string; consent_to_logging: boolean; source_page: string | null; prompt_version: string; model: string; message_count: number; lead_id: string | null; retain_until: string; last_message_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; session_token_hash: string; requester_hash: string; status?: string; consent_to_logging?: boolean; source_page?: string | null; prompt_version: string; model: string; message_count?: number; lead_id?: string | null; retain_until: string; last_message_at?: string | null; created_at?: string; updated_at?: string };
        Update: { status?: string; consent_to_logging?: boolean; source_page?: string | null; prompt_version?: string; model?: string; message_count?: number; lead_id?: string | null; retain_until?: string; last_message_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      ai_messages: {
        Row: { id: number; conversation_id: string; role: string; body: string; sources: Json; model: string | null; prompt_version: string | null; created_at: string };
        Insert: { id?: number; conversation_id: string; role: string; body: string; sources?: Json; model?: string | null; prompt_version?: string | null; created_at?: string };
        Update: { body?: string; sources?: Json };
        Relationships: [];
      };
      ai_events: {
        Row: { id: number; conversation_id: string | null; event_type: string; metadata: Json; created_at: string };
        Insert: { id?: number; conversation_id?: string | null; event_type: string; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      ai_knowledge_items: {
        Row: { id: string; knowledge_key: string; category: string; title: string; content: string; href: string | null; is_approved: boolean; sort_order: number; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; knowledge_key: string; category: string; title: string; content: string; href?: string | null; is_approved?: boolean; sort_order?: number; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { knowledge_key?: string; category?: string; title?: string; content?: string; href?: string | null; is_approved?: boolean; sort_order?: number; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      ai_rate_limits: {
        Row: { requester_hash: string; window_start: string; request_count: number; updated_at: string };
        Insert: { requester_hash: string; window_start: string; request_count?: number; updated_at?: string };
        Update: { request_count?: number; updated_at?: string };
        Relationships: [];
      };
      automation_workflows: {
        Row: { workflow_key: string; display_name: string; version: number; trigger_event: string; description: string; n8n_workflow_name: string | null; is_enabled: boolean; retry_limit: number; timeout_seconds: number; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { workflow_key: string; display_name: string; version?: number; trigger_event: string; description?: string; n8n_workflow_name?: string | null; is_enabled?: boolean; retry_limit?: number; timeout_seconds?: number; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { display_name?: string; version?: number; trigger_event?: string; description?: string; n8n_workflow_name?: string | null; is_enabled?: boolean; retry_limit?: number; timeout_seconds?: number; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      automation_events: {
        Row: { id: string; event_key: string; event_type: string; entity_type: string; entity_id: string; payload: Json; status: Database["public"]["Enums"]["automation_event_status"]; attempt_count: number; next_attempt_at: string; locked_at: string | null; dispatched_at: string | null; completed_at: string | null; last_error: string | null; n8n_execution_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; event_key: string; event_type: string; entity_type: string; entity_id: string; payload?: Json; status?: Database["public"]["Enums"]["automation_event_status"]; attempt_count?: number; next_attempt_at?: string; locked_at?: string | null; dispatched_at?: string | null; completed_at?: string | null; last_error?: string | null; n8n_execution_id?: string | null; created_at?: string; updated_at?: string };
        Update: { status?: Database["public"]["Enums"]["automation_event_status"]; attempt_count?: number; next_attempt_at?: string; locked_at?: string | null; dispatched_at?: string | null; completed_at?: string | null; last_error?: string | null; n8n_execution_id?: string | null; payload?: Json; updated_at?: string };
        Relationships: [];
      };
      automation_runs: {
        Row: { id: string; automation_event_id: string | null; workflow_key: string | null; workflow_version: number; external_run_id: string | null; status: Database["public"]["Enums"]["automation_run_status"]; started_at: string | null; finished_at: string | null; result: Json; error_message: string | null; retryable: boolean; created_at: string };
        Insert: { id?: string; automation_event_id?: string | null; workflow_key?: string | null; workflow_version?: number; external_run_id?: string | null; status?: Database["public"]["Enums"]["automation_run_status"]; started_at?: string | null; finished_at?: string | null; result?: Json; error_message?: string | null; retryable?: boolean; created_at?: string };
        Update: { external_run_id?: string | null; status?: Database["public"]["Enums"]["automation_run_status"]; started_at?: string | null; finished_at?: string | null; result?: Json; error_message?: string | null; retryable?: boolean };
        Relationships: [];
      };
      automation_dead_letters: {
        Row: { id: string; automation_event_id: string; workflow_key: string | null; reason: string; payload_snapshot: Json; manual_review_status: string; resolved_by: string | null; resolved_at: string | null; resolution_note: string | null; created_at: string };
        Insert: { id?: string; automation_event_id: string; workflow_key?: string | null; reason: string; payload_snapshot?: Json; manual_review_status?: string; resolved_by?: string | null; resolved_at?: string | null; resolution_note?: string | null; created_at?: string };
        Update: { manual_review_status?: string; resolved_by?: string | null; resolved_at?: string | null; resolution_note?: string | null };
        Relationships: [];
      };
      notification_settings: {
        Row: { id: string; admin_recipients: string[]; send_enquiry_confirmations: boolean; send_new_lead_alerts: boolean; send_booking_notifications: boolean; send_booking_admin_alerts: boolean; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; admin_recipients?: string[]; send_enquiry_confirmations?: boolean; send_new_lead_alerts?: boolean; send_booking_notifications?: boolean; send_booking_admin_alerts?: boolean; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { admin_recipients?: string[]; send_enquiry_confirmations?: boolean; send_new_lead_alerts?: boolean; send_booking_notifications?: boolean; send_booking_admin_alerts?: boolean; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      email_events: {
        Row: { id: string; idempotency_key: string; provider: string; provider_message_id: string | null; template_key: string; original_recipient: string; recipient: string; sender: string | null; reply_to: string | null; subject: string; status: Database["public"]["Enums"]["email_delivery_status"]; context_type: string | null; context_id: string | null; template_data: Json; provider_response: Json; retry_count: number; next_retry_at: string | null; last_error: string | null; sent_at: string | null; delivered_at: string | null; failed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; idempotency_key: string; provider?: string; provider_message_id?: string | null; template_key: string; original_recipient: string; recipient: string; sender?: string | null; reply_to?: string | null; subject: string; status?: Database["public"]["Enums"]["email_delivery_status"]; context_type?: string | null; context_id?: string | null; template_data?: Json; provider_response?: Json; retry_count?: number; next_retry_at?: string | null; last_error?: string | null; sent_at?: string | null; delivered_at?: string | null; failed_at?: string | null; created_at?: string; updated_at?: string };
        Update: { provider_message_id?: string | null; recipient?: string; sender?: string | null; reply_to?: string | null; subject?: string; status?: Database["public"]["Enums"]["email_delivery_status"]; template_data?: Json; provider_response?: Json; retry_count?: number; next_retry_at?: string | null; last_error?: string | null; sent_at?: string | null; delivered_at?: string | null; failed_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      email_provider_events: {
        Row: { id: string; provider: string; provider_event_id: string; event_type: string; provider_message_id: string | null; recipient: string | null; payload: Json; processed_at: string | null; processing_error: string | null; created_at: string };
        Insert: { id?: string; provider?: string; provider_event_id: string; event_type: string; provider_message_id?: string | null; recipient?: string | null; payload?: Json; processed_at?: string | null; processing_error?: string | null; created_at?: string };
        Update: { processed_at?: string | null; processing_error?: string | null };
        Relationships: [];
      };
      site_settings: {
        Row: { key: string; group_name: string; label: string; value: Json; is_public: boolean; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { key: string; group_name?: string; label: string; value?: Json; is_public?: boolean; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { group_name?: string; label?: string; value?: Json; is_public?: boolean; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      content_sections: {
        Row: { id: string; section_key: string; eyebrow: string | null; title: string; body: string; cta_label: string | null; cta_href: string | null; metadata: Json; status: Database["public"]["Enums"]["content_status"]; sort_order: number; created_by: string | null; updated_by: string | null; published_at: string | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; section_key: string; eyebrow?: string | null; title: string; body?: string; cta_label?: string | null; cta_href?: string | null; metadata?: Json; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; created_by?: string | null; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { eyebrow?: string | null; title?: string; body?: string; cta_label?: string | null; cta_href?: string | null; metadata?: Json; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      testimonials: {
        Row: { id: string; client_name: string; company_name: string | null; role_title: string | null; quote: string; permission_granted: boolean; case_study_id: string | null; media_asset_id: string | null; status: Database["public"]["Enums"]["content_status"]; sort_order: number; created_by: string | null; updated_by: string | null; published_at: string | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; client_name: string; company_name?: string | null; role_title?: string | null; quote: string; permission_granted?: boolean; case_study_id?: string | null; media_asset_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; created_by?: string | null; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { client_name?: string; company_name?: string | null; role_title?: string | null; quote?: string; permission_granted?: boolean; case_study_id?: string | null; media_asset_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      faqs: {
        Row: { id: string; category: string; question: string; answer: string; status: Database["public"]["Enums"]["content_status"]; sort_order: number; created_by: string | null; updated_by: string | null; published_at: string | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; category?: string; question: string; answer: string; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; created_by?: string | null; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { category?: string; question?: string; answer?: string; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      team_members: {
        Row: { id: string; display_name: string; role_title: string; bio: string; public_email: string | null; linkedin_url: string | null; media_asset_id: string | null; status: Database["public"]["Enums"]["content_status"]; sort_order: number; created_by: string | null; updated_by: string | null; published_at: string | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; display_name: string; role_title: string; bio?: string; public_email?: string | null; linkedin_url?: string | null; media_asset_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; created_by?: string | null; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { display_name?: string; role_title?: string; bio?: string; public_email?: string | null; linkedin_url?: string | null; media_asset_id?: string | null; status?: Database["public"]["Enums"]["content_status"]; sort_order?: number; updated_by?: string | null; published_at?: string | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      security_events: {
        Row: { id: number; event_type: string; severity: Database["public"]["Enums"]["security_severity"]; actor_user_id: string | null; request_id: string | null; route: string | null; source: string; requester_hash: string | null; user_agent_hash: string | null; metadata: Json; created_at: string };
        Insert: { id?: number; event_type: string; severity?: Database["public"]["Enums"]["security_severity"]; actor_user_id?: string | null; request_id?: string | null; route?: string | null; source?: string; requester_hash?: string | null; user_agent_hash?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      security_rate_limits: {
        Row: { key_hash: string; bucket: string; window_start: string; request_count: number; updated_at: string };
        Insert: { key_hash: string; bucket: string; window_start: string; request_count?: number; updated_at?: string };
        Update: { request_count?: number; updated_at?: string };
        Relationships: [];
      };
      data_retention_policies: {
        Row: { policy_key: string; resource_name: string; retention_days: number; enabled: boolean; notes: string; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { policy_key: string; resource_name: string; retention_days: number; enabled?: boolean; notes?: string; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { resource_name?: string; retention_days?: number; enabled?: boolean; notes?: string; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      audit_logs: {
        Row: { id: number; actor_user_id: string | null; action: string; object_type: string; object_id: string | null; request_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: number; actor_user_id?: string | null; action: string; object_type: string; object_id?: string | null; request_id?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      booking_types: {
        Row: { id: string; slug: string; label: string; description: string; duration_minutes: number; service_type: string | null; provider: string; provider_url: string | null; is_active: boolean; sort_order: number; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; slug: string; label: string; description?: string; duration_minutes?: number; service_type?: string | null; provider?: string; provider_url?: string | null; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { slug?: string; label?: string; description?: string; duration_minutes?: number; service_type?: string | null; provider?: string; provider_url?: string | null; is_active?: boolean; sort_order?: number; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      booking_handoffs: {
        Row: { id: string; token: string; lead_id: string; booking_type_slug: string | null; attribution: Json; expires_at: string; used_at: string | null; created_at: string };
        Insert: { id?: string; token?: string; lead_id: string; booking_type_slug?: string | null; attribution?: Json; expires_at?: string; used_at?: string | null; created_at?: string };
        Update: { booking_type_slug?: string | null; attribution?: Json; expires_at?: string; used_at?: string | null };
        Relationships: [];
      };
      meetings: {
        Row: { id: string; lead_id: string | null; booking_type_id: string | null; provider: string; provider_booking_id: string; provider_event_type: string | null; title: string | null; attendee_name: string | null; attendee_email: string | null; starts_at: string | null; ends_at: string | null; timezone: string | null; meeting_url: string | null; location_text: string | null; status: Database["public"]["Enums"]["meeting_status"]; rescheduled_from_provider_id: string | null; cancelled_at: string | null; safe_metadata: Json; created_at: string; updated_at: string };
        Insert: { id?: string; lead_id?: string | null; booking_type_id?: string | null; provider?: string; provider_booking_id: string; provider_event_type?: string | null; title?: string | null; attendee_name?: string | null; attendee_email?: string | null; starts_at?: string | null; ends_at?: string | null; timezone?: string | null; meeting_url?: string | null; location_text?: string | null; status?: Database["public"]["Enums"]["meeting_status"]; rescheduled_from_provider_id?: string | null; cancelled_at?: string | null; safe_metadata?: Json; created_at?: string; updated_at?: string };
        Update: { lead_id?: string | null; booking_type_id?: string | null; provider_event_type?: string | null; title?: string | null; attendee_name?: string | null; attendee_email?: string | null; starts_at?: string | null; ends_at?: string | null; timezone?: string | null; meeting_url?: string | null; location_text?: string | null; status?: Database["public"]["Enums"]["meeting_status"]; rescheduled_from_provider_id?: string | null; cancelled_at?: string | null; safe_metadata?: Json; updated_at?: string };
        Relationships: [];
      };
      booking_webhook_events: {
        Row: { id: string; provider: string; event_key: string; trigger_event: string; provider_booking_id: string | null; payload: Json; processed_at: string | null; processing_error: string | null; created_at: string };
        Insert: { id?: string; provider?: string; event_key: string; trigger_event: string; provider_booking_id?: string | null; payload?: Json; processed_at?: string | null; processing_error?: string | null; created_at?: string };
        Update: { processed_at?: string | null; processing_error?: string | null };
        Relationships: [];
      };
      project_briefs: {
        Row: { id: string; session_token: string; idempotency_key: string | null; status: string; service_type: string | null; service_id: string | null; company_name: string | null; industry: string | null; current_url: string | null; objective: string | null; timeline: string | null; desired_start: string | null; deadline: string | null; urgency: string | null; budget_band: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null; timezone_country: string | null; requirements: string | null; marketing_consent: boolean; privacy_accepted: boolean; source: string; attribution: Json; lead_id: string | null; submitted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; session_token: string; idempotency_key?: string | null; status?: string; service_type?: string | null; service_id?: string | null; company_name?: string | null; industry?: string | null; current_url?: string | null; objective?: string | null; timeline?: string | null; desired_start?: string | null; deadline?: string | null; urgency?: string | null; budget_band?: string | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; timezone_country?: string | null; requirements?: string | null; marketing_consent?: boolean; privacy_accepted?: boolean; source?: string; attribution?: Json; lead_id?: string | null; submitted_at?: string | null; created_at?: string; updated_at?: string };
        Update: { idempotency_key?: string | null; status?: string; service_type?: string | null; service_id?: string | null; company_name?: string | null; industry?: string | null; current_url?: string | null; objective?: string | null; timeline?: string | null; desired_start?: string | null; deadline?: string | null; urgency?: string | null; budget_band?: string | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; timezone_country?: string | null; requirements?: string | null; marketing_consent?: boolean; privacy_accepted?: boolean; source?: string; attribution?: Json; lead_id?: string | null; submitted_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      brief_answers: {
        Row: { id: string; brief_id: string; answer_key: string; answer_value: Json; created_at: string; updated_at: string };
        Insert: { id?: string; brief_id: string; answer_key: string; answer_value: Json; created_at?: string; updated_at?: string };
        Update: { answer_key?: string; answer_value?: Json; updated_at?: string };
        Relationships: [];
      };
      estimate_rules: {
        Row: { id: string; rule_key: string; label: string; rule_type: "base" | "feature" | "complexity" | "urgency" | "support"; service_type: string | null; match_key: string; amount_min: number; amount_max: number; multiplier: number; currency: string; config: Json; is_active: boolean; sort_order: number; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; rule_key: string; label: string; rule_type: "base" | "feature" | "complexity" | "urgency" | "support"; service_type?: string | null; match_key: string; amount_min?: number; amount_max?: number; multiplier?: number; currency?: string; config?: Json; is_active?: boolean; sort_order?: number; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { rule_key?: string; label?: string; rule_type?: "base" | "feature" | "complexity" | "urgency" | "support"; service_type?: string | null; match_key?: string; amount_min?: number; amount_max?: number; multiplier?: number; currency?: string; config?: Json; is_active?: boolean; sort_order?: number; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      estimate_results: {
        Row: { id: string; brief_id: string; currency: string; subtotal_min: number; subtotal_max: number; final_min: number; final_max: number; inputs: Json; adjustments: Json; rule_snapshot: Json; created_at: string };
        Insert: { id?: string; brief_id: string; currency?: string; subtotal_min: number; subtotal_max: number; final_min: number; final_max: number; inputs?: Json; adjustments?: Json; rule_snapshot?: Json; created_at?: string };
        Update: { currency?: string; subtotal_min?: number; subtotal_max?: number; final_min?: number; final_max?: number; inputs?: Json; adjustments?: Json; rule_snapshot?: Json };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_ai_rate_limit: { Args: { p_requester_hash: string; p_limit: number }; Returns: boolean };
      consume_security_rate_limit: { Args: { p_key_hash: string; p_bucket: string; p_limit: number; p_window_seconds: number }; Returns: { allowed: boolean; remaining: number; reset_at: string }[] };
      purge_expired_operational_data: { Args: Record<PropertyKey, never>; Returns: Json };
      purge_expired_ai_conversations: { Args: Record<PropertyKey, never>; Returns: number };

      current_app_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["app_role"] };
      current_user_is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      current_user_can_manage_users: { Args: Record<PropertyKey, never>; Returns: boolean };
      user_can_access_media: { Args: { asset_id: string }; Returns: boolean };
      submit_project_brief: { Args: { p_brief_id: string; p_idempotency_key: string; p_lead_score: number; p_score_reasons: Json }; Returns: Json };
      merge_leads: { Args: { p_source_id: string; p_target_id: string; p_actor_id: string }; Returns: Json };
    };
    Enums: {
      app_role: "super_admin" | "admin" | "staff" | "client";
      analytics_event_name: "primary_cta_click" | "project_brief_start" | "project_brief_step" | "project_brief_submit" | "contact_submit" | "booking_click" | "booking_complete" | "case_study_view" | "case_study_cta_click";
      security_severity: "info" | "warning" | "critical";
      invitation_status: "pending" | "accepted" | "revoked" | "expired";
      lead_status: "new" | "qualified" | "contacted" | "consultation_booked" | "discovery_complete" | "proposal_sent" | "negotiation" | "won" | "lost" | "nurture";
      lead_priority: "low" | "normal" | "high" | "urgent";
      meeting_status: "scheduled" | "cancelled" | "completed" | "no_show";
      email_delivery_status: "queued" | "sending" | "sent" | "delivered" | "delivery_delayed" | "bounced" | "complained" | "failed" | "suppressed" | "skipped";
      automation_event_status: "pending" | "dispatching" | "dispatched" | "completed" | "failed" | "dead_letter" | "cancelled";
      automation_run_status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
      project_member_role: "client" | "collaborator";
      milestone_status: "planned" | "in_progress" | "waiting_client" | "approved" | "completed" | "cancelled";
      client_request_type: "revision" | "question" | "change_request" | "feedback";
      client_request_status: "open" | "in_review" | "waiting_client" | "completed" | "declined";
      approval_status: "pending" | "approved" | "rejected" | "withdrawn";
      project_status: "planned" | "active" | "on_hold" | "completed" | "cancelled";
      content_status: "draft" | "published" | "archived";
      media_visibility: "public" | "private";
    };
    CompositeTypes: Record<string, never>;
  };
};
