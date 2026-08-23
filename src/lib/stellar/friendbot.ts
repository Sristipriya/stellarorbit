import { NETWORK } from "./network";

export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${NETWORK.friendbotUrl}/?addr=${encodeURIComponent(address)}`);
    return res.ok;
  } catch (error) {
    console.error("Failed to reach Friendbot:", error);
    return false;
  }
}
