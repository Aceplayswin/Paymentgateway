function LegalDocument({ sections }) {
  return (
    <div className="legal-document">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="legal-document__section">
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list ? (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export default LegalDocument;
