FROM mcr.microsoft.com/devcontainers/rust:1-1-bookworm

# Install Node.js 20.x LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs build-essential \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Add wasm32 compilation target for Soroban smart contracts
USER vscode
RUN rustup target add wasm32-unknown-unknown \
    && rustup component add clippy rustfmt

