FROM socrata/runit-nodejs

# LABEL must be last for proper base image discoverability
LABEL repository.socrata/nodejs=""

ENV GEO_IMPORT_ENV=prod
ENV BABEL_DISABLE_CACHE=1
ENV SERVICE_DIR /etc/service/geo-import
ENV ROOT_DIR /srv/geo-import

EXPOSE 4445
# Need git and gdal for node-srs
RUN apt-get -y update && apt-get install -y git gdal-bin

COPY runit ${SERVICE_DIR}
WORKDIR ${ROOT_DIR}

# Add the stuff that makes up the base node app
ADD package.json ${ROOT_DIR}/
ADD lib.tar ${ROOT_DIR}

# Passing --production prevents node-srs from installing.
# We will set it up sans symlinks in the next step
RUN npm install --production

WORKDIR ${ROOT_DIR}

RUN date -u +"%Y-%m-%dT%H:%M:%SZ" > build-time.txt
