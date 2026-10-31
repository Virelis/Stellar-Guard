# Enterprise SIEM & Log Integration Guide

Stellar-Guard connects natively to enterprise Security Information and Event Management (SIEM) systems to provide continuous compliance monitoring, automated alerting, and audit readiness.

---

## 1. Supported SIEM Platforms
- **Splunk Enterprise & Cloud:** Via HTTP Event Collector (HEC).
- **Datadog:** Via Custom Webhook and JSON Log Pipeline.
- **Elasticsearch / Kibana (ELK):** Via Logstash JSON input.
- **IBM QRadar & Microsoft Sentinel:** Via Syslog or Webhook Forwarder.

---

## 2. Webhook Ingestion Configuration

1. In the Stellar-Guard Dashboard, open **Settings -> Webhooks**.
2. Click **Add Webhook** and provide your SIEM HTTP ingest endpoint URL.
3. Select subscribed events:
   - `proposal.created`
   - `proposal.voted`
   - `proposal.executed`
   - `asset.quarantined`
   - `risk.alert_triggered`
4. Copy the generated HMAC-SHA256 secret key to configure cryptographic signature verification on your SIEM ingest pipeline.

---

## 3. Sample Ingest Event Payload

```json
{
  "id": "evt_91b2c48e_20261031",
  "type": "asset.quarantined",
  "timestamp": 1730332800000,
  "correlationId": "corr_4829aefb",
  "data": {
    "target": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
    "asset": "USDC",
    "signers": [
      "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
      "GC3K5B632KM5L4XQOAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA"
    ],
    "txHash": "f5f20018674a432ace036a4790794e4e1ef89cfd16683129c66f87b9a1514053",
    "ledgerSequence": 52194820
  }
}
```

