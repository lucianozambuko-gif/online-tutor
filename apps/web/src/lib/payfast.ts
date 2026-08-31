// PayFast's on-site process expects a real form POST (not a link/redirect), so
// we build one dynamically and submit it — the standard PayFast integration pattern.
export function redirectToPayfast(actionUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
