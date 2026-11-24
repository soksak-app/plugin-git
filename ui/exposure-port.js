// The exposure port of the git page (docs/features.md, G1): the port that createExpose of @soksak/plugin-api requires, built from the
// exposure of the view bridge. Commands are registered through the command layer of the view bridge, so a command registration of the
// exposure sends nothing; statuses and elements go through bridge.exposure.register.
export function exposurePort(bridge, where, reportError) {
  return {
    register: (kind, name) => kind === "command" ? Promise.resolve() : bridge.exposure.register(kind, name).then(() => undefined),
    onRequest: (answer) => bridge.runtime.native.on("exposure-request", answer),
    reply: bridge.exposure.reply,
    changed: bridge.exposure.changed,
    report: (text) => reportError(where, String(text)),
  };
}
