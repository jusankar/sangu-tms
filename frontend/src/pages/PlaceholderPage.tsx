type PlaceholderPageProps = {
  title: string
  subtitle?: string
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p>{subtitle || "This module is ready for next implementation step."}</p>
    </section>
  )
}
