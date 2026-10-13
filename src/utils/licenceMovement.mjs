export function licenceMovement(transaction) {
  const quantity = Number(transaction.quantity) || 0;
  const customer = transaction.customerId?.businessDetails?.companyName || "customer";
  const amount = Math.abs(quantity);
  switch (transaction.type) {
    case "purchase": return { quantity, description: "Licences added by SpotX after purchase approval" };
    case "allocation": return { quantity: -amount, description: `Licences assigned to ${customer}` };
    case "release": return { quantity: amount, description: `Licences returned from ${customer}` };
    case "cancellation": return { quantity: amount, description: `Licences returned after cancelling ${customer}'s allocation` };
    case "adjustment": return { quantity, description: quantity >= 0 ? "Licences added through admin adjustment" : "Licences removed through admin adjustment" };
    case "registration": return { quantity: amount, description: `Screen registered for ${customer}` };
    case "activation": return { quantity: amount, description: `Screen enabled for ${customer}` };
    case "suspension": return { quantity: -amount, description: `Screen paused for ${customer}` };
    case "reactivation": return { quantity: amount, description: `Screen enabled again for ${customer}` };
    default: return { quantity, description: transaction.reason || "Inventory changed" };
  }
}
