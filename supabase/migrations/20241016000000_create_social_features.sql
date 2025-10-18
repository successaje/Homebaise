-- Social Features Database Schema
-- Creates comprehensive social and community features for the platform

-- User Profiles Extension
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    location VARCHAR(100),
    investment_style VARCHAR(50), -- conservative, moderate, aggressive
    experience_level VARCHAR(50), -- beginner, intermediate, advanced, expert
    total_invested NUMERIC DEFAULT 0,
    total_returns NUMERIC DEFAULT 0,
    portfolio_value NUMERIC DEFAULT 0,
    risk_tolerance INTEGER DEFAULT 5, -- 1-10 scale
    investment_goals TEXT[],
    social_links JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements and Badges
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- first_investment, portfolio_diversification, etc.
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon name
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Investment Activity Feed
CREATE TABLE IF NOT EXISTS public.investment_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- investment, sale, dividend, milestone
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    amount NUMERIC,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Discussions and Comments
CREATE TABLE IF NOT EXISTS public.property_discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.property_discussions(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion Votes
CREATE TABLE IF NOT EXISTS public.discussion_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID NOT NULL REFERENCES public.property_discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discussion_id, user_id)
);

-- User Connections and Following
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_type VARCHAR(20) DEFAULT 'follow' CHECK (connection_type IN ('follow', 'block')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Investment Leaderboards
CREATE TABLE IF NOT EXISTS public.investment_leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- total_returns, portfolio_value, diversification, etc.
    rank INTEGER NOT NULL,
    score NUMERIC NOT NULL,
    period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly, all_time
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, period)
);

-- Referral System
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_amount NUMERIC DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

-- Community Events
CREATE TABLE IF NOT EXISTS public.community_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- webinar, meetup, conference, workshop
    host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_attendees INTEGER,
    is_virtual BOOLEAN DEFAULT TRUE,
    meeting_url TEXT,
    location TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    registration_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(event_id, user_id)
);

-- Investment Groups and Communities
CREATE TABLE IF NOT EXISTS public.investment_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_type VARCHAR(50) NOT NULL, -- location_based, interest_based, experience_level
    location VARCHAR(100),
    interest_tags TEXT[],
    experience_level VARCHAR(50),
    is_public BOOLEAN DEFAULT TRUE,
    max_members INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Memberships
CREATE TABLE IF NOT EXISTS public.group_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.investment_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Notifications System
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_activities_user_id ON public.investment_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_activities_property_id ON public.investment_activities(property_id);
CREATE INDEX IF NOT EXISTS idx_investment_activities_created_at ON public.investment_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_discussions_property_id ON public.property_discussions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_discussions_user_id ON public.property_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_discussions_created_at ON public.property_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_connections_follower_id ON public.user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following_id ON public.user_connections(following_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_category_period ON public.investment_leaderboards(category, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON public.investment_leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer_id ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_id ON public.user_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_community_events_event_date ON public.community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON public.group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view public profiles" ON public.user_profiles
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view public achievements" ON public.user_achievements
    FOR SELECT USING (true);

-- RLS Policies for investment_activities
CREATE POLICY "Users can view public activities" ON public.investment_activities
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.investment_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for property_discussions
CREATE POLICY "Users can view all discussions" ON public.property_discussions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" ON public.property_discussions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own discussions" ON public.property_discussions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for discussion_votes
CREATE POLICY "Users can view all votes" ON public.discussion_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON public.discussion_votes
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_connections
CREATE POLICY "Users can view own connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage own connections" ON public.user_connections
    FOR ALL USING (auth.uid() = follower_id);

-- RLS Policies for investment_leaderboards
CREATE POLICY "Users can view leaderboards" ON public.investment_leaderboards
    FOR SELECT USING (true);

-- RLS Policies for user_referrals
CREATE POLICY "Users can view own referrals" ON public.user_referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.user_referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- RLS Policies for community_events
CREATE POLICY "Users can view public events" ON public.community_events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create events" ON public.community_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for event_registrations
CREATE POLICY "Users can view own registrations" ON public.event_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own registrations" ON public.event_registrations
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for investment_groups
CREATE POLICY "Users can view public groups" ON public.investment_groups
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create groups" ON public.investment_groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for group_memberships
CREATE POLICY "Users can view group memberships" ON public.group_memberships
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own memberships" ON public.group_memberships
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_property_discussions_updated_at
    BEFORE UPDATE ON public.property_discussions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_community_events_updated_at
    BEFORE UPDATE ON public.community_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_investment_groups_updated_at
    BEFORE UPDATE ON public.investment_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW public.user_profile_summary AS
SELECT 
    up.*,
    u.email,
    COUNT(DISTINCT ia.id) as total_activities,
    COUNT(DISTINCT pd.id) as total_discussions,
    COUNT(DISTINCT uc_following.following_id) as following_count,
    COUNT(DISTINCT uc_followers.follower_id) as followers_count,
    COALESCE(SUM(ia.amount), 0) as total_investment_amount
FROM public.user_profiles up
JOIN auth.users u ON up.user_id = u.id
LEFT JOIN public.investment_activities ia ON up.user_id = ia.user_id
LEFT JOIN public.property_discussions pd ON up.user_id = pd.user_id
LEFT JOIN public.user_connections uc_following ON up.user_id = uc_following.follower_id
LEFT JOIN public.user_connections uc_followers ON up.user_id = uc_followers.following_id
GROUP BY up.id, u.email;

CREATE OR REPLACE VIEW public.property_discussion_summary AS
SELECT 
    pd.*,
    up.display_name as author_name,
    up.avatar_url as author_avatar,
    up.experience_level as author_experience,
    COUNT(DISTINCT pd_child.id) as reply_count,
    COUNT(DISTINCT dv.id) FILTER (WHERE dv.vote_type = 'upvote') as upvotes,
    COUNT(DISTINCT dv.id) FILTER (WHERE dv.vote_type = 'downvote') as downvotes
FROM public.property_discussions pd
JOIN public.user_profiles up ON pd.user_id = up.user_id
LEFT JOIN public.property_discussions pd_child ON pd.id = pd_child.parent_id
LEFT JOIN public.discussion_votes dv ON pd.id = dv.discussion_id
GROUP BY pd.id, up.display_name, up.avatar_url, up.experience_level;

-- Grant permissions
GRANT SELECT ON public.user_profile_summary TO authenticated;
GRANT SELECT ON public.property_discussion_summary TO authenticated;

-- Insert some default achievements
INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, description, icon) VALUES
('00000000-0000-0000-0000-000000000000', 'first_investment', 'First Investment', 'Made your first property investment', '🎯'),
('00000000-0000-0000-0000-000000000000', 'portfolio_diversification', 'Diversified Portfolio', 'Invested in 3+ different properties', '📊'),
('00000000-0000-0000-0000-000000000000', 'community_contributor', 'Community Contributor', 'Posted 10+ helpful discussions', '💬'),
('00000000-0000-0000-0000-000000000000', 'top_investor', 'Top Investor', 'Ranked in top 10% of investors', '🏆'),
('00000000-0000-0000-0000-000000000000', 'early_adopter', 'Early Adopter', 'Joined the platform in beta', '🚀');

