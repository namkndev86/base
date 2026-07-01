# --- BUILDER STAGE ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy monorepo root config
COPY package.json ./

# Copy all workspaces package.json files to cache npm install
COPY shared-common/package.json ./shared-common/
COPY shared-contracts/package.json ./shared-contracts/
COPY shared-protobuf/package.json ./shared-protobuf/
COPY shared-sdk/package.json ./shared-sdk/
COPY api-gateway/package.json ./api-gateway/
COPY identity-service/package.json ./identity-service/
COPY authorization-service/package.json ./authorization-service/
COPY tenant-service/package.json ./tenant-service/
COPY notification-service/package.json ./notification-service/
COPY file-service/package.json ./file-service/
COPY audit-service/package.json ./audit-service/
COPY search-service/package.json ./search-service/
COPY scheduler-service/package.json ./scheduler-service/
COPY configuration-service/package.json ./configuration-service/
COPY feature-flag-service/package.json ./feature-flag-service/
COPY workflow-service/package.json ./workflow-service/
COPY integration-service/package.json ./integration-service/

# Install all monorepo dependencies
RUN npm install --package-lock=false

# Copy shared packages
COPY shared-protobuf/ ./shared-protobuf/
COPY shared-contracts/ ./shared-contracts/
COPY shared-common/ ./shared-common/
COPY shared-sdk/ ./shared-sdk/

# Compile shared libraries in dependency order
RUN npm run build --workspace=@platform/shared-protobuf && \
    npm run build --workspace=@platform/shared-contracts && \
    npm run build --workspace=@platform/shared-common && \
    npm run build --workspace=@platform/shared-sdk

# Define which service to build
ARG SERVICE_NAME

# Copy the service specific code
COPY ${SERVICE_NAME}/ ./${SERVICE_NAME}/

# Build the service
RUN npm run build --workspace=@platform/${SERVICE_NAME}


# --- RUNTIME STAGE ---
FROM node:18-alpine
WORKDIR /usr/src/app

ARG SERVICE_NAME
ENV SERVICE_DIR=${SERVICE_NAME}

# Copy node_modules and built resources
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/shared-protobuf ./shared-protobuf
COPY --from=builder /usr/src/app/shared-contracts ./shared-contracts
COPY --from=builder /usr/src/app/shared-common ./shared-common
COPY --from=builder /usr/src/app/shared-sdk ./shared-sdk
COPY --from=builder /usr/src/app/${SERVICE_NAME}/dist ./${SERVICE_NAME}/dist
COPY --from=builder /usr/src/app/${SERVICE_NAME}/package.json ./${SERVICE_NAME}/package.json

EXPOSE 3000 3001 3002 3003 50051 50052 50053

# Start the service
CMD node ${SERVICE_DIR}/dist/main.js
