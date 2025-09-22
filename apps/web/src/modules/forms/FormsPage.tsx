import { useState } from "react";
import { useSession } from "../auth/useSession";
import { useForms, useCreateForm } from "./hooks";

export default function FormsPage() {
  const { token } = useSession(); // resolves after /api/auth/me
  const { data: forms = [], isFetching } = useForms(token);
  const create = useCreateForm(token);
  const [title, setTitle] = useState("");

  return (
    <div>
      <h2>Forms</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title) return;
          create.mutate({ title, schema: { fields: [] } });
          setTitle("");
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <button disabled={create.isPending}>Create</button>
      </form>

      {isFetching ? <p>Loading…</p> : (
        <ul>{forms.map((f: any) => <li key={f.id}>{f.title}</li>)}</ul>
      )}
    </div>
  );
}
