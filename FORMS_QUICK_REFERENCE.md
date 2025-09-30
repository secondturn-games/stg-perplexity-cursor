# Forms with Loading States - Quick Reference

**📝 Everything you need to know about forms with DiceLoader integration**

---

## 🚀 Quick Start (60 seconds)

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

const schema = yup.object({
  email: yup.string().email().required(),
  message: yup.string().min(10).required(),
});

function MyForm() {
  const { isLoading, withLoading } = useLoading();
  const [loadingMessage, setLoadingMessage] = useState('Submitting...');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    await withLoading(async () => {
      await api.post('/api/submit', data);
      setSuccess(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-busy={isLoading}>
      <fieldset disabled={isLoading}>
        <input {...register('email')} />
        <textarea {...register('message')} />
        <button type='submit'>Submit</button>
      </fieldset>
      
      {success && <p role='status'>✓ Success!</p>}
      
      <DiceLoader isVisible={isLoading} text={loadingMessage} />
    </form>
  );
}
```

---

## 📦 Available Form Components

### Pre-built Forms

```tsx
import { SignInForm, SignUpForm } from '@/components/auth';
import { ContactForm, ListingCreationForm, FormWithLoading } from '@/components/forms';
```

### Form Utilities

```tsx
import { createFormHandler, validators } from '@/lib/form-handlers';
import { useLoading } from '@/hooks/useLoading';
```

---

## 📋 Form Patterns

### Pattern 1: Simple Form with Loading

```tsx
function SimpleForm() {
  const { isLoading, withLoading } = useLoading();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    await withLoading(async () => {
      await api.post('/api/submit', data);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={isLoading}>
        <input {...register('name')} />
        <button type='submit' disabled={isLoading}>Submit</button>
      </fieldset>
      <DiceLoader isVisible={isLoading} text="Submitting..." />
    </form>
  );
}
```

### Pattern 2: Form with Validation

```tsx
const schema = yup.object({
  email: yup.string().email().required('Email is required'),
  password: yup.string().min(8).required('Password is required'),
});

function ValidatedForm() {
  const { isLoading, withLoading } = useLoading();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} disabled={isLoading} />
      {errors.email && <p role='alert'>{errors.email.message}</p>}
      
      <DiceLoader isVisible={isLoading} text="Validating..." />
    </form>
  );
}
```

### Pattern 3: Form with Success State

```tsx
function FormWithSuccess() {
  const { isLoading, withLoading } = useLoading();
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data) => {
    setSuccess(false);
    
    await withLoading(async () => {
      await api.post('/api/submit', data);
      setSuccess(true);
      await new Promise(r => setTimeout(r, 500)); // Show success
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {success && !isLoading && (
        <div role='status' aria-live='polite'>
          ✓ Form submitted successfully!
        </div>
      )}
      
      <fieldset disabled={isLoading}>
        {/* inputs */}
      </fieldset>
      
      <DiceLoader isVisible={isLoading} text="Submitting..." />
    </form>
  );
}
```

### Pattern 4: FormWithLoading Wrapper

```tsx
import { FormWithLoading } from '@/components/forms';

function MyForm() {
  const { isLoading, withLoading } = useLoading();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      await submitData();
      setSuccess('Submitted successfully!');
    });
  };

  return (
    <FormWithLoading
      onSubmit={handleSubmit}
      isLoading={isLoading}
      loadingText="Processing..."
      error={error}
      success={success}
    >
      <input disabled={isLoading} />
      <button type='submit' disabled={isLoading}>Submit</button>
    </FormWithLoading>
  );
}
```

---

## ♿ Accessibility Checklist

### Required Attributes

```tsx
// Required fields
<Input
  aria-required='true'              // ✅ Mark as required
  aria-invalid={!!errors.field}     // ✅ Mark validation state
  aria-describedby='field-error'    // ✅ Link to error
  disabled={isLoading}              // ✅ Disable during loading
/>

// Error messages
<p id='field-error' role='alert'>  // ✅ Announce errors
  {errors.field.message}
</p>

// Success messages
<div role='status' aria-live='polite'> // ✅ Announce success
  ✓ Success!
</div>

// Form state
<form aria-busy={isLoading}>      // ✅ Indicate busy state
  <fieldset disabled={isLoading}> // ✅ Disable all inputs
    {/* inputs */}
  </fieldset>
</form>
```

---

## 🎯 Loading Messages

### Authentication Forms
```
"Signing in..."
"Creating your account..."
"Connecting to Google..."
"Redirecting to Google..."
"Sign in successful!"
"Account created successfully!"
```

### Contact Forms
```
"Sending your message..."
"Message sent successfully!"
```

### Listing Forms
```
"Searching BoardGameGeek..."
"Uploading images..."
"Creating your listing..."
"Listing created successfully!"
```

---

## ⚙️ Validation Examples

### Email

```tsx
email: yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required')
```

### Password

```tsx
password: yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Must contain uppercase, lowercase, and number'
  )
  .required('Password is required')
```

### Price

```tsx
price: yup
  .number()
  .positive('Price must be greater than 0')
  .max(10000, 'Price must be less than €10,000')
  .required('Price is required')
```

### Text with Length

```tsx
description: yup
  .string()
  .min(20, 'Description must be at least 20 characters')
  .max(2000, 'Description must be less than 2000 characters')
  .required('Description is required')
```

---

## 🔄 Complete Form Flow

```
1. User fills form
   ↓
2. Validation on blur/submit
   ↓
3. User clicks submit
   ↓
4. Loading starts: "Submitting..."
   ↓
5. All inputs disabled
   ↓
6. API call executes
   ↓
7. Success: "Success message!"
   ↓
8. Brief delay (500ms)
   ↓
9. Form resets or redirects
   ↓
10. Loading hides
```

---

## 🆘 Common Issues

**Form not disabling?**
```tsx
// Use fieldset
<fieldset disabled={isLoading}>
  {/* All inputs auto-disabled */}
</fieldset>
```

**Multiple submissions?**
```tsx
// Disable button
<button disabled={isLoading} aria-busy={isLoading}>
```

**Validation not working?**
```tsx
// Check yupResolver
const { register, handleSubmit } = useForm({
  resolver: yupResolver(schema), // ← Must include
});
```

**Success not showing?**
```tsx
// Set success state before redirect
setSuccess(true);
await new Promise(r => setTimeout(r, 500)); // Show success
router.push('/next-page');
```

---

## 📚 Full Documentation

- **Forms Implementation**: `FORM_LOADING_IMPLEMENTATION.md`
- **useLoading Hook**: `hooks/useLoading.README.md`
- **DiceLoader Component**: `components/ui/DiceLoader.README.md`
- **API Integration**: `lib/API_INTEGRATION.md`

---

**Ready to build forms!** 🚀