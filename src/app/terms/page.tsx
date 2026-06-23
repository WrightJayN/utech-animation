export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>
      <p style={{
        fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
        color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12
      }}>
        Legal
      </p>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 40, fontWeight: 800,
        letterSpacing: '-0.02em', marginBottom: 8
      }}>
        Terms & Conditions
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 48 }}>
        Last updated: {new Date().toLocaleDateString('en-JM', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {[
        {
          title: '1. Platform Overview',
          body: `The UTech Animation Portfolio Gallery ("Platform") is operated by the University of Technology, Jamaica for the purpose of showcasing student creative work. By creating an account or uploading content, you agree to these terms in full.`
        },
        {
          title: '2. Eligibility',
          body: `The Platform is open to current and former students of the UTech Animation program. Public visitors may browse portfolios without an account. Only registered students may upload portfolios, like content, and leave comments.`
        },
        {
          title: '3. Content Standards',
          body: `All uploaded content must be your own original work or work you have explicit rights to share. Content that is sexually explicit, violently graphic, hateful, or infringes on third-party intellectual property rights is strictly prohibited. By uploading content you confirm you hold the necessary rights to publish it.`
        },
        {
          title: '4. Portfolio Visibility',
          body: `Students may set their portfolios to Public (visible to all), Unlisted (accessible only via direct link, not searchable), or Private (visible only to the uploading student). Visibility can be changed at any time unless the portfolio has been taken down by an administrator.`
        },
        {
          title: '5. Reporting',
          body: `Any registered user may submit one report per portfolio under the categories of Inappropriate Content or Copyright Infringement. Reports are reviewed by platform administrators. Submitting false or malicious reports may result in account suspension. Report statuses are: Pending (under review), Reviewed (seen by admin), Actioned (enforcement taken), and Dismissed (no violation found).`
        },
        {
          title: '6. Administrative Warnings',
          body: `Administrators may issue a formal warning to a portfolio for content that does not meet platform standards but does not yet warrant removal. Warnings are issued for durations of 3 days, 1 week, or 2 weeks. A warning is visible to the portfolio owner and serves as notice to amend the content. Repeated violations after a warning may result in an immediate takedown.`
        },
        {
          title: '7. Portfolio Takedowns',
          body: `Administrators reserve the right to take down any portfolio that violates these terms. When a portfolio is taken down, it is hidden from public view and search. The portfolio is not deleted at this stage. The student will be notified of the reason for the takedown through their dashboard.`
        },
        {
          title: '8. Appeals',
          body: `A student whose portfolio has been taken down may submit one appeal. The appeal must include a written statement. Once submitted, the appeal cannot be withdrawn or resubmitted. An administrator will review the appeal and either approve it (restoring the portfolio to active status) or deny it. If denied, the decision is final and cannot be further appealed through the Platform.`
        },
        {
          title: '9. Denied Appeals & Data Deletion',
          body: `If an appeal is denied, the portfolio will be permanently locked in a Denied Appeal status. Exactly one year from the date of denial, the portfolio, all associated media, comments, likes, reports, and takedown records will be permanently and irrecoverably deleted from the Platform. Students are advised to retain copies of their own work. No restoration is possible after deletion.`
        },
        {
          title: '10. Admin Override',
          body: `In exceptional circumstances — such as administrative error or the discovery of new material information — a platform administrator may override a denied appeal and restore a portfolio to active status before the scheduled deletion date. This override is at the sole discretion of the administration and does not constitute a right of the student.`
        },
        {
          title: '11. Intellectual Property',
          body: `Students retain full ownership of their uploaded work. By uploading to the Platform you grant UTech Animation a non-exclusive, royalty-free licence to display your work on the Platform for the purposes of education and portfolio showcase. This licence ends when you delete the portfolio or your account is removed.`
        },
        {
          title: '12. Account Termination',
          body: `The Platform administrators reserve the right to suspend or terminate any account that repeatedly violates these terms, submits false reports, or engages in conduct deemed harmful to the Platform community.`
        },
        {
          title: '13. Changes to These Terms',
          body: `These terms may be updated at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised terms. Material changes will be communicated via the Platform.`
        },
        {
          title: '14. Contact',
          body: `For questions about these terms or to contact the moderation team, please reach out through your institution's official channels.`
        },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18, fontWeight: 700, marginBottom: 10
          }}>
            {section.title}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: '#d4d4d8' }}>
            {section.body}
          </p>
        </div>
      ))}
    </div>
  )
}