CREATE TABLE "ad_auction_bids" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"creative_id" varchar NOT NULL,
	"placement_id" varchar NOT NULL,
	"bid_amount" integer NOT NULL,
	"bid_strategy" varchar NOT NULL,
	"targeting_score" integer DEFAULT 0,
	"quality_score" integer DEFAULT 0,
	"is_winning" boolean DEFAULT false,
	"final_price" integer,
	"user_segment" varchar,
	"content_category" varchar,
	"page_type" varchar,
	"device_type" varchar,
	"bid_timestamp" timestamp DEFAULT now(),
	"auction_duration" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_ad_auction_bids_bid_amount" CHECK ("ad_auction_bids"."bid_amount" >= 50),
	CONSTRAINT "CHK_ad_auction_bids_scores" CHECK ("ad_auction_bids"."targeting_score" >= 0 AND "ad_auction_bids"."targeting_score" <= 100 AND "ad_auction_bids"."quality_score" >= 0 AND "ad_auction_bids"."quality_score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "ad_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"objective" varchar NOT NULL,
	"campaign_type" varchar NOT NULL,
	"daily_budget" integer NOT NULL,
	"total_budget" integer,
	"bid_strategy" varchar DEFAULT 'cpm',
	"max_bid" integer NOT NULL,
	"target_audience" jsonb,
	"target_categories" text[],
	"target_keywords" text[],
	"exclude_keywords" text[],
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"time_slots" jsonb,
	"status" varchar DEFAULT 'draft',
	"is_active" boolean DEFAULT false,
	"total_spent" integer DEFAULT 0,
	"total_impressions" integer DEFAULT 0,
	"total_clicks" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_ad_campaigns_objective" CHECK ("ad_campaigns"."objective" IN ('brand_awareness', 'traffic', 'conversions', 'video_views')),
	CONSTRAINT "CHK_ad_campaigns_type" CHECK ("ad_campaigns"."campaign_type" IN ('display', 'video', 'overlay', 'sponsored_content')),
	CONSTRAINT "CHK_ad_campaigns_bid_strategy" CHECK ("ad_campaigns"."bid_strategy" IN ('cpm', 'cpc', 'cpa', 'viewable_cpm')),
	CONSTRAINT "CHK_ad_campaigns_status" CHECK ("ad_campaigns"."status" IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
	CONSTRAINT "CHK_ad_campaigns_budget" CHECK ("ad_campaigns"."daily_budget" >= 1000 AND "ad_campaigns"."max_bid" >= 100)
);
--> statement-breakpoint
CREATE TABLE "ad_creatives" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"creative_type" varchar NOT NULL,
	"title" varchar,
	"description" text,
	"image_url" varchar,
	"video_url" varchar,
	"thumbnail_url" varchar,
	"cta_text" varchar,
	"cta_url" varchar,
	"dimensions" jsonb,
	"aspect_ratio" varchar,
	"file_size" integer,
	"duration" integer,
	"status" varchar DEFAULT 'pending',
	"is_active" boolean DEFAULT false,
	"moderation_notes" text,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_ad_creatives_type" CHECK ("ad_creatives"."creative_type" IN ('image', 'video', 'text', 'rich_media')),
	CONSTRAINT "CHK_ad_creatives_status" CHECK ("ad_creatives"."status" IN ('pending', 'approved', 'rejected', 'active', 'paused'))
);
--> statement-breakpoint
CREATE TABLE "ad_impressions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"creative_id" varchar NOT NULL,
	"placement_id" varchar NOT NULL,
	"cost" integer NOT NULL,
	"revenue" integer NOT NULL,
	"creator_revenue" integer NOT NULL,
	"user_id" varchar,
	"video_id" varchar,
	"stream_id" varchar,
	"user_segment" varchar,
	"age_group" varchar,
	"location" varchar,
	"device_type" varchar,
	"browser_type" varchar,
	"impression_type" varchar NOT NULL,
	"view_duration" integer DEFAULT 0,
	"is_viewable" boolean DEFAULT false,
	"is_clicked" boolean DEFAULT false,
	"click_timestamp" timestamp,
	"ip_hash" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_ad_impressions_type" CHECK ("ad_impressions"."impression_type" IN ('view', 'skip', 'complete')),
	CONSTRAINT "CHK_ad_impressions_cost" CHECK ("ad_impressions"."cost" >= 0 AND "ad_impressions"."revenue" >= 0 AND "ad_impressions"."creator_revenue" >= 0),
	CONSTRAINT "CHK_ad_impressions_view_duration" CHECK ("ad_impressions"."view_duration" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ad_placements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"placement_type" varchar NOT NULL,
	"position" varchar,
	"page_types" text[],
	"categories" text[],
	"dimensions" jsonb,
	"max_duration" integer,
	"floor_price" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_ad_placements_type" CHECK ("ad_placements"."placement_type" IN ('pre_roll', 'mid_roll', 'post_roll', 'banner', 'overlay', 'sidebar')),
	CONSTRAINT "CHK_ad_placements_floor_price" CHECK ("ad_placements"."floor_price" >= 50)
);
--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"industry" varchar,
	"contact_email" varchar NOT NULL,
	"contact_person" varchar,
	"website" varchar,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"account_balance" integer DEFAULT 0,
	"total_spent" integer DEFAULT 0,
	"allowed_categories" text[],
	"blocked_keywords" text[],
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_advertisers_user_id" UNIQUE("user_id"),
	CONSTRAINT "CHK_advertisers_balance" CHECK ("advertisers"."account_balance" >= 0),
	CONSTRAINT "CHK_advertisers_spent" CHECK ("advertisers"."total_spent" >= 0)
);
--> statement-breakpoint
CREATE TABLE "channel_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"subscriber_count" integer DEFAULT 0,
	"subscriber_change" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"daily_views" integer DEFAULT 0,
	"total_watch_time" integer DEFAULT 0,
	"daily_watch_time" integer DEFAULT 0,
	"average_view_duration" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"shares_count" integer DEFAULT 0,
	"daily_revenue" integer DEFAULT 0,
	"total_revenue" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_channel_analytics_user_date" UNIQUE("user_id","date"),
	CONSTRAINT "CHK_channel_analytics_subscriber_count" CHECK ("channel_analytics"."subscriber_count" >= 0),
	CONSTRAINT "CHK_channel_analytics_total_views" CHECK ("channel_analytics"."total_views" >= 0),
	CONSTRAINT "CHK_channel_analytics_daily_views" CHECK ("channel_analytics"."daily_views" >= 0),
	CONSTRAINT "CHK_channel_analytics_watch_time" CHECK ("channel_analytics"."total_watch_time" >= 0 AND "channel_analytics"."daily_watch_time" >= 0),
	CONSTRAINT "CHK_channel_analytics_engagement" CHECK ("channel_analytics"."likes_count" >= 0 AND "channel_analytics"."comments_count" >= 0 AND "channel_analytics"."shares_count" >= 0),
	CONSTRAINT "CHK_channel_analytics_revenue" CHECK ("channel_analytics"."daily_revenue" >= 0 AND "channel_analytics"."total_revenue" >= 0)
);
--> statement-breakpoint
CREATE TABLE "channel_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"channel_name" varchar,
	"channel_description" text,
	"banner_url" varchar,
	"logo_url" varchar,
	"channel_trailer_video_id" varchar,
	"website_url" varchar,
	"twitter_handle" varchar,
	"instagram_handle" varchar,
	"facebook_url" varchar,
	"default_category" varchar,
	"default_privacy" varchar DEFAULT 'public',
	"auto_translate" boolean DEFAULT false,
	"monetization_enabled" boolean DEFAULT false,
	"superchat_enabled" boolean DEFAULT false,
	"membership_enabled" boolean DEFAULT false,
	"public_stats" boolean DEFAULT true,
	"comments_enabled" boolean DEFAULT true,
	"ratings_enabled" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"comment_notifications" boolean DEFAULT true,
	"subscription_notifications" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_channel_settings_user_id" UNIQUE("user_id"),
	CONSTRAINT "CHK_channel_settings_default_privacy" CHECK ("channel_settings"."default_privacy" IN ('public', 'unlisted', 'private'))
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar DEFAULT 'normal',
	"amount" integer,
	"currency" varchar DEFAULT 'KRW',
	"color" varchar,
	"is_moderator_message" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_like" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_comment_likes_comment_user" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar,
	"stream_id" varchar,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"parent_id" varchar,
	"like_count" integer DEFAULT 0,
	"dislike_count" integer DEFAULT 0,
	"is_hearted" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_performance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar,
	"stream_id" varchar,
	"date" timestamp NOT NULL,
	"views" integer DEFAULT 0,
	"unique_views" integer DEFAULT 0,
	"watch_time" integer DEFAULT 0,
	"average_view_duration" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"dislikes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"click_through_rate" integer DEFAULT 0,
	"search_traffic" integer DEFAULT 0,
	"suggested_traffic" integer DEFAULT 0,
	"direct_traffic" integer DEFAULT 0,
	"external_traffic" integer DEFAULT 0,
	"retention_rate_25" integer DEFAULT 0,
	"retention_rate_50" integer DEFAULT 0,
	"retention_rate_75" integer DEFAULT 0,
	"retention_rate_100" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_content_performance_video_date" UNIQUE("video_id","date"),
	CONSTRAINT "UQ_content_performance_stream_date" UNIQUE("stream_id","date"),
	CONSTRAINT "CHK_content_performance_content_exists" CHECK (("content_performance"."video_id" IS NOT NULL) OR ("content_performance"."stream_id" IS NOT NULL)),
	CONSTRAINT "CHK_content_performance_views" CHECK ("content_performance"."views" >= 0 AND "content_performance"."unique_views" >= 0 AND "content_performance"."unique_views" <= "content_performance"."views"),
	CONSTRAINT "CHK_content_performance_time_metrics" CHECK ("content_performance"."watch_time" >= 0 AND "content_performance"."average_view_duration" >= 0),
	CONSTRAINT "CHK_content_performance_engagement" CHECK ("content_performance"."likes" >= 0 AND "content_performance"."dislikes" >= 0 AND "content_performance"."comments" >= 0 AND "content_performance"."shares" >= 0),
	CONSTRAINT "CHK_content_performance_impressions" CHECK ("content_performance"."impressions" >= 0),
	CONSTRAINT "CHK_content_performance_ctr" CHECK ("content_performance"."click_through_rate" >= 0 AND "content_performance"."click_through_rate" <= 10000),
	CONSTRAINT "CHK_content_performance_traffic" CHECK ("content_performance"."search_traffic" >= 0 AND "content_performance"."suggested_traffic" >= 0 AND "content_performance"."direct_traffic" >= 0 AND "content_performance"."external_traffic" >= 0),
	CONSTRAINT "CHK_content_performance_retention" CHECK ("content_performance"."retention_rate_25" >= 0 AND "content_performance"."retention_rate_50" >= 0 AND "content_performance"."retention_rate_75" >= 0 AND "content_performance"."retention_rate_100" >= 0 AND "content_performance"."retention_rate_25" <= 10000 AND "content_performance"."retention_rate_50" <= 10000 AND "content_performance"."retention_rate_75" <= 10000 AND "content_performance"."retention_rate_100" <= 10000)
);
--> statement-breakpoint
CREATE TABLE "copyright_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" varchar NOT NULL,
	"video_id" varchar,
	"stream_id" varchar,
	"claim_type" varchar NOT NULL,
	"rights_owner_type" varchar NOT NULL,
	"copyright_owner" text NOT NULL,
	"description" text NOT NULL,
	"evidence" text,
	"contact_email" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewer_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_copyright_reports_content_exists" CHECK (("copyright_reports"."video_id" IS NOT NULL) OR ("copyright_reports"."stream_id" IS NOT NULL)),
	CONSTRAINT "CHK_copyright_reports_claim_type" CHECK ("copyright_reports"."claim_type" IN ('music', 'video', 'image', 'other')),
	CONSTRAINT "CHK_copyright_reports_rights_owner_type" CHECK ("copyright_reports"."rights_owner_type" IN ('myself', 'representative')),
	CONSTRAINT "CHK_copyright_reports_status" CHECK ("copyright_reports"."status" IN ('pending', 'reviewed', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "creator_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"is_monetization_enabled" boolean DEFAULT false,
	"is_superchat_enabled" boolean DEFAULT false,
	"is_live_streaming_enabled" boolean DEFAULT false,
	"is_eligible" boolean DEFAULT false,
	"stripe_account_id" varchar,
	"country" varchar DEFAULT 'KR',
	"date_of_birth" timestamp,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "creator_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" varchar NOT NULL,
	"following_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_follows_follower_following" UNIQUE("follower_id","following_id"),
	CONSTRAINT "CHK_follows_no_self_follow" CHECK ("follows"."follower_id" != "follows"."following_id")
);
--> statement-breakpoint
CREATE TABLE "member_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"tier_id" varchar,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"image_url" varchar,
	"video_id" varchar,
	"stream_id" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_member_content_type" CHECK ("member_content"."type" IN ('post', 'video', 'stream', 'emoji', 'badge'))
);
--> statement-breakpoint
CREATE TABLE "membership_benefits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"value" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_membership_benefits_type" CHECK ("membership_benefits"."type" IN ('emoji', 'badge', 'early_access', 'exclusive_content', 'chat_color', 'live_chat_priority', 'custom'))
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"monthly_price" integer NOT NULL,
	"yearly_price" integer,
	"color" varchar DEFAULT '#6366f1',
	"emoji" varchar,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_membership_tiers_price" CHECK ("membership_tiers"."monthly_price" >= 1000)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"stream_id" varchar NOT NULL,
	"stripe_payment_intent_id" varchar,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'KRW',
	"status" varchar DEFAULT 'pending',
	"creator_amount" integer,
	"platform_amount" integer,
	"message" text,
	"is_superchat" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "playlist_videos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" varchar NOT NULL,
	"video_id" varchar NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_playlist_videos_playlist_video" UNIQUE("playlist_id","video_id"),
	CONSTRAINT "CHK_playlist_videos_order_index" CHECK ("playlist_videos"."order_index" >= 0)
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" varchar,
	"is_public" boolean DEFAULT true,
	"video_count" integer DEFAULT 0,
	"total_duration" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_playlists_video_count" CHECK ("playlists"."video_count" >= 0),
	CONSTRAINT "CHK_playlists_total_duration" CHECK ("playlists"."total_duration" >= 0)
);
--> statement-breakpoint
CREATE TABLE "revenue_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"report_month" varchar NOT NULL,
	"ad_revenue" integer DEFAULT 0,
	"superchat_revenue" integer DEFAULT 0,
	"membership_revenue" integer DEFAULT 0,
	"other_revenue" integer DEFAULT 0,
	"total_revenue" integer DEFAULT 0,
	"platform_fee" integer DEFAULT 0,
	"processing_fee" integer DEFAULT 0,
	"net_revenue" integer DEFAULT 0,
	"tax_withheld" integer DEFAULT 0,
	"taxable_amount" integer DEFAULT 0,
	"payment_status" varchar DEFAULT 'pending',
	"payment_date" timestamp,
	"payment_method" varchar,
	"total_views" integer DEFAULT 0,
	"monetized_views" integer DEFAULT 0,
	"rpm" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_revenue_reports_user_month" UNIQUE("user_id","report_month"),
	CONSTRAINT "CHK_revenue_reports_revenue" CHECK ("revenue_reports"."ad_revenue" >= 0 AND "revenue_reports"."superchat_revenue" >= 0 AND "revenue_reports"."membership_revenue" >= 0 AND "revenue_reports"."other_revenue" >= 0 AND "revenue_reports"."total_revenue" >= 0),
	CONSTRAINT "CHK_revenue_reports_fees" CHECK ("revenue_reports"."platform_fee" >= 0 AND "revenue_reports"."processing_fee" >= 0),
	CONSTRAINT "CHK_revenue_reports_views" CHECK ("revenue_reports"."total_views" >= 0 AND "revenue_reports"."monetized_views" >= 0 AND "revenue_reports"."monetized_views" <= "revenue_reports"."total_views"),
	CONSTRAINT "CHK_revenue_reports_payment_status" CHECK ("revenue_reports"."payment_status" IN ('pending', 'paid', 'failed')),
	CONSTRAINT "CHK_revenue_reports_rpm" CHECK ("revenue_reports"."rpm" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar,
	"peertube_id" integer,
	"peertube_uuid" varchar,
	"peertube_embed_url" varchar,
	"rtmp_url" varchar,
	"stream_key" varchar,
	"peertube_channel_id" integer,
	"permanent_live" boolean DEFAULT false,
	"save_replay" boolean DEFAULT true,
	"is_live" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"viewer_count" integer DEFAULT 0,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar NOT NULL,
	"new_video_notifications" boolean DEFAULT true,
	"live_stream_notifications" boolean DEFAULT true,
	"community_post_notifications" boolean DEFAULT false,
	"member_post_notifications" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT false,
	"push_notifications" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"channel_id" varchar NOT NULL,
	"tier_id" varchar,
	"type" varchar DEFAULT 'follow',
	"billing_period" varchar DEFAULT 'monthly',
	"is_active" boolean DEFAULT true,
	"stripe_subscription_id" varchar,
	"stripe_customer_id" varchar,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"total_paid" integer DEFAULT 0,
	"gifted_by" varchar,
	"gift_message" text,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_subscriptions_user_channel" UNIQUE("user_id","channel_id"),
	CONSTRAINT "CHK_subscriptions_type" CHECK ("subscriptions"."type" IN ('follow', 'member')),
	CONSTRAINT "CHK_subscriptions_billing" CHECK ("subscriptions"."billing_period" IN ('monthly', 'yearly'))
);
--> statement-breakpoint
CREATE TABLE "superchats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"payment_id" varchar,
	"message" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'KRW',
	"color" varchar NOT NULL,
	"display_duration" integer DEFAULT 120,
	"is_pinned" boolean DEFAULT false,
	"pinned_until" timestamp,
	"is_processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_ad_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"allow_personalized_ads" boolean DEFAULT true,
	"max_ads_per_session" integer DEFAULT 5,
	"preferred_ad_types" text[],
	"blocked_categories" text[],
	"blocked_advertisers" text[],
	"interests" text[],
	"recent_categories" text[],
	"avg_session_duration" integer DEFAULT 0,
	"primary_watch_time" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_user_ad_preferences_user" UNIQUE("user_id"),
	CONSTRAINT "CHK_user_ad_preferences_max_ads" CHECK ("user_ad_preferences"."max_ads_per_session" >= 0 AND "user_ad_preferences"."max_ads_per_session" <= 20)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"username" varchar,
	"role" varchar DEFAULT 'user',
	"provider" varchar DEFAULT 'email',
	"provider_id" varchar,
	"is_email_verified" boolean DEFAULT false,
	"is_banned" boolean DEFAULT false,
	"banned_until" timestamp,
	"ban_reason" text,
	"is_suspended" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "CHK_users_role" CHECK ("users"."role" IN ('user', 'admin', 'creator')),
	CONSTRAINT "CHK_users_provider" CHECK ("users"."provider" IN ('email', 'google', 'kakao', 'naver'))
);
--> statement-breakpoint
CREATE TABLE "video_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_like" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "UQ_video_likes_video_user" UNIQUE("video_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "video_thumbnails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar NOT NULL,
	"thumbnail_url" varchar NOT NULL,
	"timecode" integer NOT NULL,
	"is_selected" boolean DEFAULT false,
	"is_generated" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" varchar,
	"video_url" varchar,
	"peertube_id" integer,
	"peertube_uuid" varchar,
	"peertube_embed_url" varchar,
	"peertube_download_url" varchar,
	"peertube_channel_id" integer,
	"duration" integer,
	"view_count" integer DEFAULT 0,
	"category" varchar,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_videos_view_count" CHECK ("videos"."view_count" >= 0),
	CONSTRAINT "CHK_videos_duration" CHECK ("videos"."duration" >= 0)
);
--> statement-breakpoint
CREATE TABLE "view_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar,
	"stream_id" varchar,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"country" varchar,
	"region" varchar,
	"city" varchar,
	"device_type" varchar,
	"os" varchar,
	"browser" varchar,
	"watch_time" integer DEFAULT 0,
	"view_duration" integer DEFAULT 0,
	"completion_rate" integer DEFAULT 0,
	"traffic_source" varchar,
	"referrer" varchar,
	"search_keyword" varchar,
	"liked" boolean DEFAULT false,
	"commented" boolean DEFAULT false,
	"shared" boolean DEFAULT false,
	"subscribed_after" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "CHK_view_sessions_watch_time" CHECK ("view_sessions"."watch_time" >= 0),
	CONSTRAINT "CHK_view_sessions_view_duration" CHECK ("view_sessions"."view_duration" >= 0),
	CONSTRAINT "CHK_view_sessions_completion_rate" CHECK ("view_sessions"."completion_rate" >= 0 AND "view_sessions"."completion_rate" <= 100),
	CONSTRAINT "CHK_view_sessions_content_exists" CHECK (("view_sessions"."video_id" IS NOT NULL) OR ("view_sessions"."stream_id" IS NOT NULL)),
	CONSTRAINT "CHK_view_sessions_device_type" CHECK ("view_sessions"."device_type" IN ('mobile', 'desktop', 'tablet', 'tv') OR "view_sessions"."device_type" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "ad_auction_bids" ADD CONSTRAINT "ad_auction_bids_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_auction_bids" ADD CONSTRAINT "ad_auction_bids_creative_id_ad_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."ad_creatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_auction_bids" ADD CONSTRAINT "ad_auction_bids_placement_id_ad_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."ad_placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_creative_id_ad_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."ad_creatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_placement_id_ad_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."ad_placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_analytics" ADD CONSTRAINT "channel_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_settings" ADD CONSTRAINT "channel_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_settings" ADD CONSTRAINT "channel_settings_channel_trailer_video_id_videos_id_fk" FOREIGN KEY ("channel_trailer_video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_performance" ADD CONSTRAINT "content_performance_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_performance" ADD CONSTRAINT "content_performance_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_reports" ADD CONSTRAINT "copyright_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_reports" ADD CONSTRAINT "copyright_reports_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_reports" ADD CONSTRAINT "copyright_reports_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_settings" ADD CONSTRAINT "creator_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_content" ADD CONSTRAINT "member_content_channel_id_users_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_content" ADD CONSTRAINT "member_content_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_content" ADD CONSTRAINT "member_content_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_content" ADD CONSTRAINT "member_content_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_benefits" ADD CONSTRAINT "membership_benefits_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_tiers" ADD CONSTRAINT "membership_tiers_channel_id_users_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_videos" ADD CONSTRAINT "playlist_videos_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_videos" ADD CONSTRAINT "playlist_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_reports" ADD CONSTRAINT "revenue_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_settings" ADD CONSTRAINT "subscription_settings_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_channel_id_users_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_gifted_by_users_id_fk" FOREIGN KEY ("gifted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "superchats" ADD CONSTRAINT "superchats_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "superchats" ADD CONSTRAINT "superchats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "superchats" ADD CONSTRAINT "superchats_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ad_preferences" ADD CONSTRAINT "user_ad_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_thumbnails" ADD CONSTRAINT "video_thumbnails_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_ad_auction_bids_auction" ON "ad_auction_bids" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_auction_bids_campaign" ON "ad_auction_bids" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_auction_bids_placement" ON "ad_auction_bids" USING btree ("placement_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_auction_bids_winning" ON "ad_auction_bids" USING btree ("is_winning");--> statement-breakpoint
CREATE INDEX "IDX_ad_auction_bids_timestamp" ON "ad_auction_bids" USING btree ("bid_timestamp");--> statement-breakpoint
CREATE INDEX "IDX_ad_auction_bids_user_segment" ON "ad_auction_bids" USING btree ("user_segment");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_advertiser" ON "ad_campaigns" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_objective" ON "ad_campaigns" USING btree ("objective");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_type" ON "ad_campaigns" USING btree ("campaign_type");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_status" ON "ad_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_active" ON "ad_campaigns" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_dates" ON "ad_campaigns" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "IDX_ad_campaigns_budget" ON "ad_campaigns" USING btree ("daily_budget");--> statement-breakpoint
CREATE INDEX "IDX_ad_creatives_campaign" ON "ad_creatives" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_creatives_type" ON "ad_creatives" USING btree ("creative_type");--> statement-breakpoint
CREATE INDEX "IDX_ad_creatives_status" ON "ad_creatives" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_ad_creatives_active" ON "ad_creatives" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_auction" ON "ad_impressions" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_campaign" ON "ad_impressions" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_creative" ON "ad_impressions" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_placement" ON "ad_impressions" USING btree ("placement_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_user" ON "ad_impressions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_video" ON "ad_impressions" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_stream" ON "ad_impressions" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_type" ON "ad_impressions" USING btree ("impression_type");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_clicked" ON "ad_impressions" USING btree ("is_clicked");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_created_at" ON "ad_impressions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_user_segment" ON "ad_impressions" USING btree ("user_segment");--> statement-breakpoint
CREATE INDEX "IDX_ad_impressions_ip_hash" ON "ad_impressions" USING btree ("ip_hash");--> statement-breakpoint
CREATE INDEX "IDX_ad_placements_type" ON "ad_placements" USING btree ("placement_type");--> statement-breakpoint
CREATE INDEX "IDX_ad_placements_position" ON "ad_placements" USING btree ("position");--> statement-breakpoint
CREATE INDEX "IDX_ad_placements_active" ON "ad_placements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_ad_placements_floor_price" ON "ad_placements" USING btree ("floor_price");--> statement-breakpoint
CREATE INDEX "IDX_advertisers_user_id" ON "advertisers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_advertisers_industry" ON "advertisers" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "IDX_advertisers_verified" ON "advertisers" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "IDX_advertisers_active" ON "advertisers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_advertisers_balance" ON "advertisers" USING btree ("account_balance");--> statement-breakpoint
CREATE INDEX "IDX_channel_analytics_user_id" ON "channel_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_channel_analytics_date" ON "channel_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "IDX_channel_analytics_user_date" ON "channel_analytics" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "IDX_channel_analytics_created_at" ON "channel_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_channel_settings_user_id" ON "channel_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_channel_settings_channel_name" ON "channel_settings" USING btree ("channel_name");--> statement-breakpoint
CREATE INDEX "IDX_channel_settings_default_privacy" ON "channel_settings" USING btree ("default_privacy");--> statement-breakpoint
CREATE INDEX "IDX_channel_settings_monetization" ON "channel_settings" USING btree ("monetization_enabled");--> statement-breakpoint
CREATE INDEX "IDX_channel_settings_created_at" ON "channel_settings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_chat_messages_stream_id" ON "chat_messages" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_chat_messages_user_id" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_chat_messages_created_at" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_chat_messages_stream_created" ON "chat_messages" USING btree ("stream_id","created_at");--> statement-breakpoint
CREATE INDEX "IDX_comment_likes_comment_id" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "IDX_comment_likes_user_id" ON "comment_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_comment_likes_comment_user" ON "comment_likes" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_comments_video_id" ON "comments" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_comments_stream_id" ON "comments" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_comments_user_id" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_comments_parent_id" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "IDX_comments_created_at" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_video_id" ON "content_performance" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_stream_id" ON "content_performance" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_date" ON "content_performance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_created_at" ON "content_performance" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_video_date" ON "content_performance" USING btree ("video_id","date");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_stream_date" ON "content_performance" USING btree ("stream_id","date");--> statement-breakpoint
CREATE INDEX "IDX_content_performance_views" ON "content_performance" USING btree ("views");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_reporter_id" ON "copyright_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_video_id" ON "copyright_reports" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_stream_id" ON "copyright_reports" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_status" ON "copyright_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_claim_type" ON "copyright_reports" USING btree ("claim_type");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_created_at" ON "copyright_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_reviewed_at" ON "copyright_reports" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_video_status" ON "copyright_reports" USING btree ("video_id","status");--> statement-breakpoint
CREATE INDEX "IDX_copyright_reports_stream_status" ON "copyright_reports" USING btree ("stream_id","status");--> statement-breakpoint
CREATE INDEX "IDX_follows_follower_id" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "IDX_follows_following_id" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "IDX_follows_follower_following" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "IDX_member_content_channel_id" ON "member_content" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "IDX_member_content_tier_id" ON "member_content" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "IDX_member_content_type" ON "member_content" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_member_content_created_at" ON "member_content" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_membership_benefits_tier_id" ON "membership_benefits" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "IDX_membership_benefits_type" ON "membership_benefits" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_membership_tiers_channel_id" ON "membership_tiers" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "IDX_membership_tiers_price" ON "membership_tiers" USING btree ("monthly_price");--> statement-breakpoint
CREATE INDEX "IDX_membership_tiers_active" ON "membership_tiers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_payments_user_id" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_payments_stream_id" ON "payments" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_payments_created_at" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_playlist_videos_playlist_id" ON "playlist_videos" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "IDX_playlist_videos_video_id" ON "playlist_videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_playlist_videos_order_index" ON "playlist_videos" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "IDX_playlist_videos_playlist_order" ON "playlist_videos" USING btree ("playlist_id","order_index");--> statement-breakpoint
CREATE INDEX "IDX_playlist_videos_added_at" ON "playlist_videos" USING btree ("added_at");--> statement-breakpoint
CREATE INDEX "IDX_playlists_user_id" ON "playlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_playlists_is_public" ON "playlists" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "IDX_playlists_created_at" ON "playlists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_playlists_user_public_created" ON "playlists" USING btree ("user_id","is_public","created_at");--> statement-breakpoint
CREATE INDEX "IDX_revenue_reports_user_id" ON "revenue_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_revenue_reports_report_month" ON "revenue_reports" USING btree ("report_month");--> statement-breakpoint
CREATE INDEX "IDX_revenue_reports_payment_status" ON "revenue_reports" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "IDX_revenue_reports_payment_date" ON "revenue_reports" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "IDX_revenue_reports_created_at" ON "revenue_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_revenue_reports_user_month" ON "revenue_reports" USING btree ("user_id","report_month");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "IDX_streams_user_id" ON "streams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_streams_is_live" ON "streams" USING btree ("is_live");--> statement-breakpoint
CREATE INDEX "IDX_streams_category" ON "streams" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_streams_viewer_count" ON "streams" USING btree ("viewer_count");--> statement-breakpoint
CREATE INDEX "IDX_streams_is_live_is_public" ON "streams" USING btree ("is_live","is_public");--> statement-breakpoint
CREATE INDEX "IDX_subscription_settings_subscription_id" ON "subscription_settings" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_channel_id" ON "subscriptions" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_tier_id" ON "subscriptions" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_type" ON "subscriptions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_active" ON "subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_user_channel" ON "subscriptions" USING btree ("user_id","channel_id");--> statement-breakpoint
CREATE INDEX "IDX_subscriptions_stripe_id" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "IDX_superchats_stream_id" ON "superchats" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_superchats_user_id" ON "superchats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_superchats_amount" ON "superchats" USING btree ("amount");--> statement-breakpoint
CREATE INDEX "IDX_superchats_created_at" ON "superchats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_superchats_stream_created" ON "superchats" USING btree ("stream_id","created_at");--> statement-breakpoint
CREATE INDEX "IDX_user_ad_preferences_user" ON "user_ad_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_user_ad_preferences_personalized" ON "user_ad_preferences" USING btree ("allow_personalized_ads");--> statement-breakpoint
CREATE INDEX "IDX_video_likes_video_id" ON "video_likes" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_video_likes_user_id" ON "video_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_video_likes_video_user" ON "video_likes" USING btree ("video_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_videos_user_id" ON "videos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_videos_category" ON "videos" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_videos_view_count" ON "videos" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "IDX_videos_created_at" ON "videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_videos_is_public_created_at" ON "videos" USING btree ("is_public","created_at");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_video_id" ON "view_sessions" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_stream_id" ON "view_sessions" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_user_id" ON "view_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_session_id" ON "view_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_created_at" ON "view_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_country" ON "view_sessions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_device_type" ON "view_sessions" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_traffic_source" ON "view_sessions" USING btree ("traffic_source");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_video_created" ON "view_sessions" USING btree ("video_id","created_at");--> statement-breakpoint
CREATE INDEX "IDX_view_sessions_stream_created" ON "view_sessions" USING btree ("stream_id","created_at");