generate_keys_dir:
	mkdir ./keys

generate_jwt_private_key:
	openssl genrsa -out keys/jwt_private.key 2048

generate_jwt_public_key:
	openssl rsa -pubout -in keys/jwt_private.key -out keys/jwt_public.key

generate_jwt: generate_keys_dir generate_jwt_private_key generate_jwt_public_key

start:
	docker-compose -f docker-compose.yml -f docker-compose.$(env).yml up -d

stop:
	docker-compose -f docker-compose.yml -f docker-compose.$(env).yml stop

setup_minio:
	docker-compose -f docker-compose.yml -f docker-compose.$(env).yml exec api sh -c 'mc config host add minio http://$$MINIO_ENDPOINT:$$MINIO_PORT $$MINIO_ACCESS_KEY $$MINIO_SECRET_KEY --api S3v4 && mc mb minio/public/uploads/ && mc policy set download minio/public/uploads/'

setup: start setup_minio
	docker-compose -f docker-compose.yml -f docker-compose.$(env).yml up -d

destroy:
	docker-compose -f docker-compose.yml -f docker-compose.$(env).yml down -v

run:
	docker-compose -f docker-compose.yml -f docker-compose.$(env).yml $(cmd)
