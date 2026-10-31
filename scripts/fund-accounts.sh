#!/usr/bin/env bash
# Stellar Testnet Friendbot Account Funding Utility for Unix / macOS

set -uo pipefail

echo "=============================================="
echo " Stellar Testnet Friendbot Account Funder     "
echo "=============================================="

ADDRESSES=(
  "${@:-GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA GC3K5B632KM5L4XQOAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA}"
)

for ADDR in $ADDRESSES; do
  echo "Funding account: $ADDR"
  FRIENDBOT_URL="https://friendbot.stellar.org?addr=$ADDR"
  SUCCESS=0

  for ATTEMPT in 1 2 3; do
    if curl -s -f "$FRIENDBOT_URL" > /dev/null 2>&1; then
      echo " [OK] Successfully funded on attempt $ATTEMPT"
      SUCCESS=1
      break
    else
      echo " [WARN] Attempt $ATTEMPT failed. Retrying in 2 seconds..."
      sleep 2
    fi
  done

  if [ $SUCCESS -eq 0 ]; then
    echo " [SKIP] Friendbot request failed or account already funded: $ADDR"
  fi
done

echo "Funding sequence completed."
