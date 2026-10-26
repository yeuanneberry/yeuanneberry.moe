import { useEffect, useId, useRef, useState } from "react";

export interface SearchChapter {
  id: string;
  title: string;
  description: string;
  group: string;
  order: number;
  text: string;
}

function excerpt(chapter: SearchChapter, terms: string[]) {
  const index = terms.length ? chapter.text.toLowerCase().indexOf(terms[0]!) : -1;
  if (index < 0) return chapter.description;
  const start = Math.max(0, index - 65);
  return `${start ? "…" : ""}${chapter.text.slice(start, start + 190)}${chapter.text.length > start + 190 ? "…" : ""}`;
}

export default function DocumentationSearch({ chapters }: { chapters: SearchChapter[] }) {
  const queryId = useId();
  const groupId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All chapters");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = chapters.filter((chapter) => {
    const haystack = `${chapter.title} ${chapter.description} ${chapter.text}`.toLowerCase();
    return (group === "All chapters" || chapter.group === group) && terms.every((term) => haystack.includes(term));
  });
  const active = query.length > 0 || group !== "All chapters";

  function reset() {
    setQuery("");
    setGroup("All chapters");
    input.current?.focus();
  }

  return <section className="documentation-search" aria-label="Find a chapter">
    <fieldset className="search-controls" disabled={!ready} aria-label="Filter chapters">
      <div className="field">
        <label htmlFor={queryId}>Search the manual</label>
        <input ref={input} id={queryId} type="search" value={query} placeholder="Try fonts, Kitty, or rollback…" onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={groupId}>Section</label>
        <select id={groupId} value={group} onChange={(event) => setGroup(event.target.value)}>
          {["All chapters", ...new Set(chapters.map(chapter => chapter.group))].map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
    </fieldset>
    <div className="results-toolbar">
      <p className="result-count" role="status">{filtered.length} {filtered.length === 1 ? "chapter" : "chapters"}{active ? " found" : " to explore"}</p>
      {active && <button className="text-button" type="button" onClick={reset}>Clear filters</button>}
    </div>
    {filtered.length ? <ol className="search-results">
      {filtered.map((chapter) => <li key={chapter.id}>
        <a className="chapter-result" href={`/docs/${chapter.id}/`}>
          <span className="result-meta"><span>{String(chapter.order).padStart(2, "0")} / {chapter.group}</span><span aria-hidden="true">↗</span></span>
          <h2>{chapter.title}</h2>
          <p>{excerpt(chapter, terms)}</p>
          <span className="read-label">Read chapter <span aria-hidden="true">→</span></span>
        </a>
      </li>)}
    </ol> : <div className="empty-state">
      <h2>No chapters found</h2>
      <p>Try a different word or look across all sections.</p>
      <button type="button" onClick={reset}>Reset search</button>
    </div>}
  </section>;
}
