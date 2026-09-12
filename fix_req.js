const fs = require("fs");
const file = "src/modules/portal/hooks/useRequests.ts";
let c = fs.readFileSync(file, "utf8");
c = c.replace(
  "{ ...(body as Record<string, unknown>), client_user_id: user.id } as never",
  "{ ...(body as unknown as Record<string, unknown>), client_user_id: user.id } as never"
);
fs.writeFileSync(file, c, "utf8");
console.log("Done");