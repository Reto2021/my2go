-- Create live chat messages table for song-based chats
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_identifier TEXT NOT NULL, -- Current song playing (could be title, ID, etc.)
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone logged in can view messages
CREATE POLICY "Authenticated users can view chat messages" 
ON public.live_chat_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can send chat messages" 
ON public.live_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries by song
CREATE INDEX idx_live_chat_song ON public.live_chat_messages(song_identifier, created_at DESC);

-- Auto-delete messages older than 2 hours (cleanup via cron or app logic)
-- For now, we'll handle this in the app by filtering

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;