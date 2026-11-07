#!/bin/sh
set -e

# The uploads volume is persistent, and Docker only copies ownership into a
# named volume the first time it is created. Repair it on every start so files
# can be written even if the volume predates the Dockerfile chown.
mkdir -p /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads

exec su-exec nextjs "$@"
