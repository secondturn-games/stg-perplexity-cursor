-- =============================================================================
-- JOB PROCESSING SYSTEM MIGRATION
-- =============================================================================
-- Creates tables and functions for background job processing
-- =============================================================================

-- =============================================================================
-- 1. JOBS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('bgg_sync', 'bgg_bulk_sync', 'cache_warmup', 'user_collection_sync', 'search_prefetch')),
    payload JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    metadata JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. JOB HISTORY TABLE (for auditing and debugging)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.job_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. PERFORMANCE INDEXES
-- =============================================================================

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON public.jobs(priority);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority_created ON public.jobs(status, priority, created_at);

-- Job history indexes
CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON public.job_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_created_at ON public.job_history(created_at);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;

-- Jobs table policies
CREATE POLICY "Jobs are viewable by authenticated users" ON public.jobs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Jobs are manageable by service role" ON public.jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Job history policies
CREATE POLICY "Job history is viewable by authenticated users" ON public.job_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Job history is manageable by service role" ON public.job_history
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_job_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_updated_at();

-- Function to log job status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.job_history (job_id, status, message, metadata)
        VALUES (
            NEW.id,
            NEW.status,
            CASE
                WHEN NEW.status = 'processing' THEN 'Job started processing'
                WHEN NEW.status = 'completed' THEN 'Job completed successfully'
                WHEN NEW.status = 'failed' THEN 'Job failed: ' || COALESCE(NEW.error, 'Unknown error')
                WHEN NEW.status = 'cancelled' THEN 'Job was cancelled'
                ELSE 'Status changed to ' || NEW.status
            END,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'retry_count', NEW.metadata->>'retryCount',
                'error', NEW.error
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log status changes
CREATE TRIGGER trigger_log_job_status_change
    AFTER UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION log_job_status_change();

-- =============================================================================
-- 6. UTILITY FUNCTIONS
-- =============================================================================

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_job_stats()
RETURNS TABLE (
    total_jobs BIGINT,
    pending_jobs BIGINT,
    processing_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    cancelled_jobs BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_jobs
    FROM public.jobs;
END;
$$ LANGUAGE plpgsql;

-- Function to get jobs by status with pagination
CREATE OR REPLACE FUNCTION get_jobs_by_status(
    job_status VARCHAR(20),
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    status VARCHAR(20),
    priority VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id,
        j.type,
        j.status,
        j.priority,
        j.created_at,
        j.updated_at,
        j.metadata
    FROM public.jobs j
    WHERE j.status = job_status
    ORDER BY 
        CASE j.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        j.created_at ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs(
    days_old INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.jobs
    WHERE status IN ('completed', 'failed', 'cancelled')
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. SAMPLE DATA (for testing)
-- =============================================================================

-- Insert sample jobs for testing (only in development)
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'development' THEN
        INSERT INTO public.jobs (type, payload, status, priority, metadata) VALUES
        ('bgg_sync', '{"gameId": "13"}', 'pending', 'normal', '{"retryCount": 0, "maxRetries": 3}'),
        ('cache_warmup', '{"popularGames": true, "limit": 10}', 'pending', 'low', '{"retryCount": 0, "maxRetries": 3}'),
        ('bgg_bulk_sync', '{"gameIds": ["13", "9209", "266192"]}', 'pending', 'high', '{"retryCount": 0, "maxRetries": 3}');
    END IF;
END $$;

-- =============================================================================
-- 8. COMMENTS
-- =============================================================================

COMMENT ON TABLE public.jobs IS 'Background job queue for processing heavy operations';
COMMENT ON TABLE public.job_history IS 'Audit log for job status changes and debugging';

COMMENT ON COLUMN public.jobs.type IS 'Type of job (bgg_sync, cache_warmup, etc.)';
COMMENT ON COLUMN public.jobs.payload IS 'Job-specific data and parameters';
COMMENT ON COLUMN public.jobs.status IS 'Current job status';
COMMENT ON COLUMN public.jobs.priority IS 'Job priority for processing order';
COMMENT ON COLUMN public.jobs.metadata IS 'Job metadata including retry counts and timestamps';
COMMENT ON COLUMN public.jobs.result IS 'Job execution result (if completed)';
COMMENT ON COLUMN public.jobs.error IS 'Error message (if failed)';

COMMENT ON FUNCTION get_job_stats() IS 'Returns comprehensive job statistics';
COMMENT ON FUNCTION get_jobs_by_status(VARCHAR, INTEGER, INTEGER) IS 'Gets jobs by status with pagination';
COMMENT ON FUNCTION cleanup_old_jobs(INTEGER) IS 'Removes old completed/failed jobs';
