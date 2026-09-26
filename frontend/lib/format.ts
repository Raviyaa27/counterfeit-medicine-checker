export const fmtDate = (unixSeconds: number | bigint) =>
  new Date(Number(unixSeconds) * 1000).toLocaleDateString(undefined, { dateStyle: "medium" });

export const fmtDateTime = (unixSeconds: number | bigint) =>
  new Date(Number(unixSeconds) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
