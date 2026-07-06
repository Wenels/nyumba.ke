export function SafetyBanner() {
  return (
    <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      <span className="font-medium">Nyumba.ke safety reminder:</span> Never send
      a deposit or any money before physically viewing a property and signing a
      lease agreement.{" "}
      <a
        href="/safety"
        className="underline underline-offset-2 hover:no-underline"
      >
        Learn more
      </a>
    </div>
  );
}
