/\*\*

- API Integration with Loading States
- Complete guide for using loading animations with API calls
  \*/

import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';
import { api } from '@/lib/api';
import { searchGamesWithLoading } from '@/lib/bgg/api-with-loading';
import { signInWithEmailLoading } from '@/lib/supabase/api-with-loading';
import { createFormHandler } from '@/lib/form-handlers';

// ============================================
// 1. BASIC API CALLS
// ============================================

function BasicApiExample() {
const { isLoading, withLoading } = useLoading();

const fetchGames = async () => {
const { data, error } = await api.get(
'/api/games',
{
loadingDelay: 300, // Show loading after 300ms
},
{ withLoading }
);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Games:', data);

};

return (
<>
<button onClick={fetchGames}>Load Games</button>
<DiceLoader isVisible={isLoading} text="Fetching games..." />
</>
);
}

// ============================================
// 2. BGG API INTEGRATION
// ============================================

function BGGSearchExample() {
const { isLoading, withLoading } = useLoading();
const [results, setResults] = useState([]);

const searchGames = async (query: string) => {
const { data, error } = await searchGamesWithLoading(
query,
{ gameType: 'boardgame' },
{ withLoading },
{
loadingDelay: 300,
timeout: 30000,
onError: (error) => console.error('Search error:', error),
}
);

    if (data) {
      setResults(data.games);
    }

};

return (
<>
<input
type="text"
onChange={(e) => searchGames(e.target.value)}
placeholder="Search games..."
/>
<DiceLoader
        isVisible={isLoading}
        text="Searching BoardGameGeek..."
        variant="roll"
      />
<ul>
{results.map((game) => (
<li key={game.id}>{game.name}</li>
))}
</ul>
</>
);
}

// ============================================
// 3. SUPABASE AUTHENTICATION
// ============================================

function LoginFormExample() {
const { isLoading, withLoading } = useLoading();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleLogin = async (e: React.FormEvent) => {
e.preventDefault();
setError('');

    const { data, error: authError } = await signInWithEmailLoading(
      email,
      password,
      { withLoading },
      {
        loadingDelay: 300,
        onError: (err) => setError(err.message),
      }
    );

    if (authError) {
      setError(authError.message);
      return;
    }

    // Success - redirect or update UI
    console.log('Logged in:', data);

};

return (
<form onSubmit={handleLogin}>
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="Email"
disabled={isLoading}
/>
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
placeholder="Password"
disabled={isLoading}
/>
<button type="submit" disabled={isLoading}>
Login
</button>
{error && <p className="text-red-600">{error}</p>}
<DiceLoader isVisible={isLoading} text="Signing in..." />
</form>
);
}

// ============================================
// 4. FORM SUBMISSION WITH VALIDATION
// ============================================

function ContactFormExample() {
const { isLoading, withLoading } = useLoading();
const [formData, setFormData] = useState({
name: '',
email: '',
message: '',
});
const [errors, setErrors] = useState<Record<string, string>>({});
const [success, setSuccess] = useState(false);

const handleSubmit = createFormHandler(
async (data) => {
const response = await fetch('/api/contact', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data),
});

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    { withLoading },
    {
      validate: (data) => {
        const errors: Record<string, string> = {};
        if (!data.name) errors.name = 'Name is required';
        if (!data.email) errors.email = 'Email is required';
        if (!/\S+@\S+\.\S+/.test(data.email))
          errors.email = 'Invalid email';
        if (!data.message) errors.message = 'Message is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
      onSuccess: () => {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      },
      onError: (error) => {
        setErrors({ form: error.message });
      },
      onValidationError: (validationErrors) => {
        setErrors(validationErrors);
      },
      resetOnSuccess: true,
    }

);

const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();
setErrors({});
setSuccess(false);
await handleSubmit(formData, e.currentTarget);
};

return (
<form onSubmit={onSubmit}>
<div>
<label>Name</label>
<input
type="text"
value={formData.name}
onChange={(e) => setFormData({ ...formData, name: e.target.value })}
disabled={isLoading}
/>
{errors.name && <span className="error">{errors.name}</span>}
</div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <label>Message</label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          disabled={isLoading}
        />
        {errors.message && <span className="error">{errors.message}</span>}
      </div>

      <button type="submit" disabled={isLoading}>
        Send Message
      </button>

      {success && <p className="success">Message sent successfully!</p>}
      {errors.form && <p className="error">{errors.form}</p>}

      <DiceLoader isVisible={isLoading} text="Sending message..." />
    </form>

);
}

// ============================================
// 5. MULTIPLE CONCURRENT API CALLS
// ============================================

function DashboardExample() {
const { isLoading, withLoading } = useLoading();
const [data, setData] = useState({
games: [],
users: [],
stats: {},
});

const loadDashboard = async () => {
// All three calls will show a single loading indicator
// Loading persists until ALL complete
const [gamesResult, usersResult, statsResult] = await Promise.all([
api.get('/api/games', {}, { withLoading }),
api.get('/api/users', {}, { withLoading }),
api.get('/api/stats', {}, { withLoading }),
]);

    setData({
      games: gamesResult.data || [],
      users: usersResult.data || [],
      stats: statsResult.data || {},
    });

};

return (
<>
<button onClick={loadDashboard}>Load Dashboard</button>
<DiceLoader
        isVisible={isLoading}
        text="Loading dashboard..."
        variant="spin"
      />
{/_ Render dashboard data _/}
</>
);
}

// ============================================
// 6. SEQUENTIAL OPERATIONS WITH PROGRESS
// ============================================

function DataMigrationExample() {
const { isLoading, withLoading } = useLoading();
const [progress, setProgress] = useState('');

const runMigration = async () => {
await withLoading(async () => {
setProgress('Step 1: Backing up data...');
await api.post('/api/migrate/backup', {});

      setProgress('Step 2: Transforming data...');
      await api.post('/api/migrate/transform', {});

      setProgress('Step 3: Validating data...');
      await api.post('/api/migrate/validate', {});

      setProgress('Step 4: Committing changes...');
      await api.post('/api/migrate/commit', {});

      setProgress('Migration complete!');
    });

};

return (
<>
<button onClick={runMigration} disabled={isLoading}>
Run Migration
</button>
<p>{progress}</p>
<DiceLoader isVisible={isLoading} text={progress || 'Processing...'} />
</>
);
}

// ============================================
// 7. ERROR HANDLING
// ============================================

function ErrorHandlingExample() {
const { isLoading, withLoading } = useLoading({
onError: (error) => {
// Global error handler
console.error('API Error:', error);
},
hideOnError: true, // Auto-hide loading on error
});

const [error, setError] = useState('');

const fetchDataWithErrorHandling = async () => {
setError('');

    try {
      const { data, error: apiError } = await api.get(
        '/api/risky-endpoint',
        {
          retry: true, // Enable retry on failure
          retryAttempts: 3,
          retryDelay: 1000,
          onError: (err) => {
            setError(`Failed after retries: ${err.message}`);
          },
        },
        { withLoading }
      );

      if (apiError) {
        setError(apiError.message);
        return;
      }

      console.log('Success:', data);
    } catch (err) {
      setError('Unexpected error occurred');
    }

};

return (
<>
<button onClick={fetchDataWithErrorHandling}>Fetch Data</button>
{error && <div className="error">{error}</div>}
<DiceLoader isVisible={isLoading} text="Loading..." />
</>
);
}

// ============================================
// 8. TIMEOUT CONFIGURATION
// ============================================

function TimeoutExample() {
const { isLoading, withLoading } = useLoading({
defaultTimeout: 10000, // 10 seconds default
onTimeout: () => {
alert('Request timed out. Please try again.');
},
});

const fetchWithCustomTimeout = async () => {
// Override default timeout for this specific call
const { data, error } = await api.get(
'/api/slow-endpoint',
{
timeout: 60000, // 60 seconds for slow operations
loadingDelay: 500, // Wait 500ms before showing loading
},
{ withLoading }
);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Data:', data);

};

return (
<>
<button onClick={fetchWithCustomTimeout}>Fetch with Timeout</button>
<DiceLoader isVisible={isLoading} text="This may take a while..." />
</>
);
}

// ============================================
// 9. OPTIMISTIC UPDATES
// ============================================

function OptimisticUpdateExample() {
const { isLoading, withLoading } = useLoading();
const [items, setItems] = useState([
{ id: 1, name: 'Item 1' },
{ id: 2, name: 'Item 2' },
]);

const deleteItem = async (id: number) => {
// Optimistically remove item from UI
const previousItems = [...items];
setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const { error } = await api.delete(`/api/items/${id}`, {}, { withLoading });

      if (error) {
        // Rollback on error
        setItems(previousItems);
        throw error;
      }
    } catch (err) {
      console.error('Delete failed:', err);
      // Items already rolled back
    }

};

return (
<>
<ul>
{items.map((item) => (
<li key={item.id}>
{item.name}
<button onClick={() => deleteItem(item.id)} disabled={isLoading}>
Delete
</button>
</li>
))}
</ul>
<DiceLoader isVisible={isLoading} text="Deleting..." />
</>
);
}

// ============================================
// 10. POLLING WITH LOADING STATES
// ============================================

function PollingExample() {
const { isLoading, withLoading } = useLoading();
const [status, setStatus] = useState('pending');
const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

const startJob = async () => {
// Start the job
const { data } = await api.post('/api/jobs/start', {}, {}, { withLoading });

    if (data?.jobId) {
      // Start polling for status
      pollIntervalRef.current = setInterval(async () => {
        const { data: statusData } = await api.get(
          `/api/jobs/${data.jobId}`,
          { showLoading: false } // Don't show loading for polls
        );

        if (statusData?.status === 'completed') {
          setStatus('completed');
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        }
      }, 2000); // Poll every 2 seconds
    }

};

useEffect(() => {
return () => {
if (pollIntervalRef.current) {
clearInterval(pollIntervalRef.current);
}
};
}, []);

return (
<>
<button onClick={startJob} disabled={isLoading || status === 'polling'}>
Start Job
</button>
<p>Status: {status}</p>
<DiceLoader isVisible={isLoading} text="Starting job..." />
</>
);
}

export {
BasicApiExample,
BGGSearchExample,
LoginFormExample,
ContactFormExample,
DashboardExample,
DataMigrationExample,
ErrorHandlingExample,
TimeoutExample,
OptimisticUpdateExample,
PollingExample,
};
