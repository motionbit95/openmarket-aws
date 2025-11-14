# ========================================
# OpenMarket AWS - Makefile
# Quick commands for common tasks
# ========================================

.PHONY: help
help: ## Show this help message
	@echo "OpenMarket AWS - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ========================================
# Development
# ========================================

.PHONY: init
init: ## Initialize project (first time setup)
	@echo "🚀 Initializing OpenMarket AWS..."
	@cp -n .env.example .env || true
	@echo "✅ Environment file created (.env)"
	@echo "📝 Please update .env with your configuration"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Copy existing code: make copy-code"
	@echo "  2. Start services: make up"

.PHONY: copy-code
copy-code: ## Copy code from existing projects
	@echo "📦 Copying code from existing projects..."
	@cp -r ../openmarket-backend/* ./backend/ 2>/dev/null || echo "⚠️  Backend source not found"
	@cp -r ../openmarket-client/* ./frontend-web/ 2>/dev/null || echo "⚠️  Frontend source not found"
	@cp -r ../openmarket_user_app/* ./mobile-app/ 2>/dev/null || echo "⚠️  Mobile app source not found"
	@rm -rf ./backend/node_modules ./frontend-web/node_modules 2>/dev/null || true
	@echo "✅ Code copied successfully"

.PHONY: up
up: ## Start all services
	@echo "🚀 Starting all services..."
	docker compose up -d
	@echo "✅ Services started!"
	@echo ""
	@$(MAKE) status

.PHONY: down
down: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker compose down
	@echo "✅ Services stopped"

.PHONY: restart
restart: ## Restart all services
	@echo "🔄 Restarting all services..."
	docker compose restart
	@echo "✅ Services restarted"

.PHONY: rebuild
rebuild: ## Rebuild and restart services
	@echo "🔨 Rebuilding services..."
	docker compose up -d --build
	@echo "✅ Services rebuilt and started"

.PHONY: clean
clean: ## Stop services and remove volumes
	@echo "🧹 Cleaning up..."
	docker compose down -v
	@echo "✅ Cleanup complete"

# ========================================
# Service Control
# ========================================

.PHONY: backend
backend: ## Start only backend services
	docker compose up -d mysql redis backend

.PHONY: frontend
frontend: ## Start only frontend service
	docker compose up -d frontend-web

.PHONY: db
db: ## Start only database services
	docker compose up -d mysql redis

# ========================================
# Logs
# ========================================

.PHONY: logs
logs: ## Show all logs
	docker compose logs -f

.PHONY: logs-backend
logs-backend: ## Show backend logs
	docker compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Show frontend logs
	docker compose logs -f frontend-web

.PHONY: logs-db
logs-db: ## Show database logs
	docker compose logs -f mysql

# ========================================
# Status & Info
# ========================================

.PHONY: status
status: ## Show service status
	@echo "📊 Service Status:"
	@docker compose ps
	@echo ""
	@echo "🌐 Access URLs:"
	@echo "  User Portal:    http://localhost:3000"
	@echo "  Admin Portal:   http://localhost:3000/admin"
	@echo "  Seller Portal:  http://localhost:3000/seller"
	@echo "  Backend API:    http://localhost:3001/api"
	@echo "  API Docs:       http://localhost:3001/api-docs"
	@echo "  Adminer (DB):   http://localhost:8080"
	@echo "  Redis UI:       http://localhost:8081"

.PHONY: stats
stats: ## Show resource usage
	docker compose stats

.PHONY: ps
ps: ## List running containers
	docker compose ps

# ========================================
# Database
# ========================================

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "🔄 Running database migrations..."
	docker compose exec backend npx prisma migrate dev
	@echo "✅ Migrations complete"

.PHONY: db-seed
db-seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	docker compose exec backend npm run seed:all
	@echo "✅ Database seeded"

.PHONY: db-reset
db-reset: ## Reset database (WARNING: destructive)
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose exec backend npx prisma migrate reset --force; \
		echo "✅ Database reset complete"; \
	fi

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	@echo "🎨 Opening Prisma Studio..."
	docker compose exec backend npx prisma studio

# ========================================
# Testing
# ========================================

.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	docker compose exec backend npm test

.PHONY: test-backend
test-backend: ## Run backend tests
	docker compose exec backend npm test

.PHONY: test-frontend
test-frontend: ## Run frontend tests
	docker compose exec frontend-web npm test

# ========================================
# Shell Access
# ========================================

.PHONY: shell-backend
shell-backend: ## Access backend shell
	docker compose exec backend sh

.PHONY: shell-frontend
shell-frontend: ## Access frontend shell
	docker compose exec frontend-web sh

.PHONY: shell-db
shell-db: ## Access MySQL shell
	docker compose exec mysql mysql -u openmarket -popenmarket123 openmarket

.PHONY: shell-redis
shell-redis: ## Access Redis CLI
	docker compose exec redis redis-cli -a redis123

# ========================================
# Development Tools
# ========================================

.PHONY: lint
lint: ## Run linters
	@echo "🔍 Running linters..."
	docker compose exec backend npm run lint || true
	docker compose exec frontend-web npm run lint || true

.PHONY: format
format: ## Format code
	@echo "✨ Formatting code..."
	docker compose exec backend npm run format || true
	docker compose exec frontend-web npm run format || true

# ========================================
# Production
# ========================================

.PHONY: prod-up
prod-up: ## Start production simulation
	@echo "🚀 Starting production environment..."
	docker compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started"

.PHONY: prod-down
prod-down: ## Stop production simulation
	docker compose -f docker-compose.prod.yml down

.PHONY: prod-logs
prod-logs: ## Show production logs
	docker compose -f docker-compose.prod.yml logs -f

# ========================================
# Utilities
# ========================================

.PHONY: health
health: ## Check service health
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:3001/health || echo "❌ Backend is down"
	@curl -f http://localhost:3000/api/health || echo "❌ Frontend is down"

.PHONY: open
open: ## Open services in browser
	@echo "🌐 Opening services..."
	@open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || echo "Please open http://localhost:3000"

.PHONY: backup-db
backup-db: ## Backup database
	@echo "💾 Backing up database..."
	@mkdir -p backups
	docker compose exec mysql mysqldump -u openmarket -popenmarket123 openmarket > backups/db-backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "✅ Database backed up to backups/"

.PHONY: clean-docker
clean-docker: ## Clean Docker system
	@echo "🧹 Cleaning Docker system..."
	docker system prune -af --volumes
	@echo "✅ Docker system cleaned"

# ========================================
# Documentation
# ========================================

.PHONY: docs
docs: ## Open documentation
	@echo "📚 Documentation:"
	@echo "  README:     README.md"
	@echo "  Setup:      SETUP.md"
	@echo "  API Docs:   http://localhost:3001/api-docs"

.PHONY: tree
tree: ## Show project structure
	@tree -L 3 -I 'node_modules|.git|dist|build|.next' .
