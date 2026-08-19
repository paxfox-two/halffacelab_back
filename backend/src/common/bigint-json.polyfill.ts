// BigInt ids (users, products, trials, ...) are not natively JSON
// serializable, and every Prisma model in this schema uses them. Import
// this once, as a side effect, before any response gets serialized — both
// in the real app entrypoint (main.ts) and in tests that build the Nest
// app directly without going through main.ts.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
  this: bigint,
): string {
  return this.toString();
};
