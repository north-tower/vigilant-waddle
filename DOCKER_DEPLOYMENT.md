# Docker Deployment Guide

This guide explains how to deploy the Fee Management System backend using Docker.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher
- At least 2GB of free disk space
- At least 1GB of available RAM

## Quick Start

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` and set the following required variables:

```env
NODE_ENV=production
PORT=5000
DB_HOST=db
DB_USER=app_user
DB_PASSWORD=your_secure_password_here
DB_NAME=fee_management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important:** 
- Change `JWT_SECRET` to a strong random string
- Change `DB_PASSWORD` to a secure password
- Update `CORS_ORIGIN` with your frontend domain
- Configure email settings if you need email functionality

### 2. Build and Start Services

For development:

```bash
docker-compose up -d
```

For production:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will:
- Build the Node.js application image
- Start MySQL database container
- Start the application container
- Initialize the database with the schema

### 3. Check Service Status

```bash
docker-compose ps
```

### 4. View Logs

View all logs:
```bash
docker-compose logs -f
```

View specific service logs:
```bash
docker-compose logs -f app
docker-compose logs -f db
```

### 5. Seed Initial Data (Optional)

If you need to seed initial data:

```bash
docker-compose exec app npm run seed
```

## Common Commands

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ This deletes database data)

```bash
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose build --no-cache app
docker-compose up -d
```

### Access Database

```bash
docker-compose exec db mysql -u root -p
# Enter the root password from your .env file
```

### Access Application Container

```bash
docker-compose exec app sh
```

### Restart Services

```bash
docker-compose restart
```

## Production Deployment

### Using Production Compose File

1. Ensure your `.env` file has all production values set
2. Use the production compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Production Considerations

1. **Database Security:**
   - The production compose file only exposes MySQL on localhost
   - Use strong passwords
   - Consider using Docker secrets for sensitive data

2. **Application Security:**
   - Set `NODE_ENV=production`
   - Use a strong `JWT_SECRET`
   - Configure proper `CORS_ORIGIN`
   - Set up SSL/TLS with a reverse proxy (nginx/traefik)

3. **Backups:**
   - Regularly backup the MySQL volume
   - Backup the uploads directory

4. **Monitoring:**
   - Set up health checks monitoring
   - Monitor container logs
   - Set up resource limits

### Backup Database

```bash
docker-compose exec db mysqldump -u root -p${DB_PASSWORD} fee_management > backup.sql
```

### Restore Database

```bash
docker-compose exec -T db mysql -u root -p${DB_PASSWORD} fee_management < backup.sql
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs app`
2. Verify environment variables: `docker-compose config`
3. Check database connection: `docker-compose exec app node -e "require('./config/database').testConnection()"`

### Database Connection Issues

1. Ensure database is healthy: `docker-compose ps`
2. Check database logs: `docker-compose logs db`
3. Verify environment variables match between services

### Port Already in Use

If port 5000 is already in use, change it in `.env`:
```env
PORT=5001
```

And update docker-compose.yml:
```yaml
ports:
  - "${PORT:-5001}:5000"
```

### Permission Issues with Uploads

```bash
docker-compose exec app chown -R node:node /app/uploads
docker-compose exec app chmod -R 755 /app/uploads
```

## Health Checks

The application includes health check endpoints:

- Application: `http://localhost:5000/health`
- API Root: `http://localhost:5000/`

## Volumes

The following volumes are created:

- `mysql_data` (or `mysql_data_prod`): Persistent MySQL data
- `./uploads`: Application uploads directory
- `./logs`: Application logs directory

## Network

Services communicate through the `fee-management-network` bridge network.

## Updating the Application

1. Pull latest code changes
2. Rebuild the image:
   ```bash
   docker-compose build app
   ```
3. Restart the service:
   ```bash
   docker-compose up -d app
   ```

## Clean Up

Remove everything (containers, networks, volumes):
```bash
docker-compose down -v --remove-orphans
```

Remove unused images:
```bash
docker image prune -a
```

