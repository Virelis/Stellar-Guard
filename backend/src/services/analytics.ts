import { Transfer } from "./horizonMonitor";

export interface AssetVolumeSummary {
  asset: string;
  totalVolume: number;
  transferCount: number;
  averageAmount: number;
}

export interface AccountActivitySummary {
  address: string;
  totalAmount: number;
  count: number;
}

export interface AnalyticsReport {
  totalTransfers: number;
  volumeByAsset: AssetVolumeSummary[];
  topRecipients: AccountActivitySummary[];
  topSenders: AccountActivitySummary[];
  generatedAt: string;
}

export function computeTransferAnalytics(transfers: Transfer[]): AnalyticsReport {
  const assetMap = new Map<string, { total: number; count: number }>();
  const recipientMap = new Map<string, { total: number; count: number }>();
  const senderMap = new Map<string, { total: number; count: number }>();

  for (const t of transfers) {
    // 1. Group by Asset
    const assetEntry = assetMap.get(t.asset) ?? { total: 0, count: 0 };
    assetEntry.total += t.amount;
    assetEntry.count += 1;
    assetMap.set(t.asset, assetEntry);

    // 2. Group by Recipient (to)
    const recEntry = recipientMap.get(t.to) ?? { total: 0, count: 0 };
    recEntry.total += t.amount;
    recEntry.count += 1;
    recipientMap.set(t.to, recEntry);

    // 3. Group by Sender (from)
    const sendEntry = senderMap.get(t.from) ?? { total: 0, count: 0 };
    sendEntry.total += t.amount;
    sendEntry.count += 1;
    senderMap.set(t.from, sendEntry);
  }

  const volumeByAsset: AssetVolumeSummary[] = Array.from(assetMap.entries()).map(
    ([asset, data]) => ({
      asset,
      totalVolume: parseFloat(data.total.toFixed(7)),
      transferCount: data.count,
      averageAmount: parseFloat((data.total / (data.count || 1)).toFixed(7)),
    })
  );

  const topRecipients: AccountActivitySummary[] = Array.from(recipientMap.entries())
    .map(([address, data]) => ({
      address,
      totalAmount: parseFloat(data.total.toFixed(7)),
      count: data.count,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  const topSenders: AccountActivitySummary[] = Array.from(senderMap.entries())
    .map(([address, data]) => ({
      address,
      totalAmount: parseFloat(data.total.toFixed(7)),
      count: data.count,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  return {
    totalTransfers: transfers.length,
    volumeByAsset,
    topRecipients,
    topSenders,
    generatedAt: new Date().toISOString(),
  };
}
