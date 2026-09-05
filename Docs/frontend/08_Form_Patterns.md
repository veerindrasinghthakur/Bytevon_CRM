# 08_Form_Patterns.md

# Bytevon Frontend — Form Patterns

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines the standard way to build Create / Edit forms across the application.

---

## 2. Recommended Stack

- **React Hook Form** for form state and performance
- **Zod** for schema validation
- `@hookform/resolvers/zod` to connect them

---

## 3. Standard Form Structure

```tsx
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  // ...
});

type FormValues = z.infer<typeof schema>;

function CreateLeadForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  });

  const mutation = useCreateLead();

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit}>
      <FormField name="name" control={form.control} label="Name">
        {(field) => <Input {...field} />}
      </FormField>
      {/* ... */}
      <Button type="submit" isLoading={mutation.isPending}>
        Create Lead
      </Button>
    </form>
  );
}
```

---

## 4. Patterns

### 4.1 Create Form
- Empty default values
- Primary action: “Create …”
- On success → invalidate list queries + navigate to detail or list

### 4.2 Edit Form
- Prefill with existing data (from a `useQuery`)
- Primary action: “Save changes”
- On success → invalidate detail + list queries

### 4.3 Multi-step Forms (future)
- Keep each step’s schema separate
- Store intermediate values in form state or URL

### 4.4 Inline / Quick Forms
- Used in drawers or modals (e.g. quick add contact)
- Same validation rules as full forms

---

## 5. Error Handling

- Field-level errors from Zod appear under the field.
- Server-side validation errors should be mapped back to fields when possible.
- Global form error (e.g. network failure) shown via Alert or Toast.

---

## 6. Accessibility & UX

- Every field has a visible label.
- Required fields are clearly marked.
- Disabled state while submitting.
- Focus management on validation errors.

---

## 7. Related Documents

- `06_API_Integration_Patterns.md`
- `07_Shared_UI_Components.md`
- Design System (Input, FormField, Button)
