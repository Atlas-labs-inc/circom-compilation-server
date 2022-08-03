GREEN='\033[0;32m'
NC='\033[0m'
if ! [ -x "$(command -v circom)" ]; then
    echo "${GREEN}Installing Circom...${NC}" >&2
    cd circom
    cargo build --release
    cargo install --path circom
    cd ..
    rm -rf circom
else
    echo "${GREEN}Circom installed...${NC}"
fi