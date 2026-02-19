#!/bin/bash

# Malar Market Digital Ledger - Server Management Script
# This script provides easy commands to start and stop the backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a process is running
is_process_running() {
    pgrep -f "$1" > /dev/null
    return $?
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    # Check if backend is already running
    if is_process_running "uvicorn app.main:app"; then
        print_warning "Backend server is already running"
        return 0
    fi
    
    # Check if virtual environment exists
    if [ ! -d "backend/venv" ]; then
        print_error "Virtual environment not found. Creating one..."
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        cd ..
    fi
    
    # Activate virtual environment and start backend
    cd backend
    source venv/bin/activate
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Save PID
    echo $BACKEND_PID > .backend.pid
    
    print_status "Backend server started on http://localhost:8000"
    print_status "Backend PID: $BACKEND_PID"
    print_status "Backend logs: logs/backend.log"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server..."
    
    # Check if frontend is already running
    if is_process_running "vite"; then
        print_warning "Frontend server is already running"
        return 0
    fi
    
    # Check if node_modules exists
    if [ ! -d "frontend/node_modules" ]; then
        print_error "node_modules not found. Installing dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    # Start frontend
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Save PID
    echo $FRONTEND_PID > .frontend.pid
    
    print_status "Frontend server started on http://localhost:5173"
    print_status "Frontend PID: $FRONTEND_PID"
    print_status "Frontend logs: logs/frontend.log"
}

# Function to start all services
start_all() {
    print_status "Starting all services..."
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start backend
    start_backend
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend
    start_frontend
    
    print_status "All services started successfully!"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
    echo "  - Frontend: http://localhost:5173"
    echo ""
    print_status "Use './run.sh stop' to stop all services"
}

# Function to stop backend
stop_backend() {
    print_status "Stopping backend server..."
    
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID
            print_status "Backend server stopped (PID: $BACKEND_PID)"
        else
            print_warning "Backend process not found"
        fi
        rm .backend.pid
    else
        print_warning "No backend PID file found"
    fi
    
    # Kill any remaining uvicorn processes
    pkill -f "uvicorn app.main:app" 2>/dev/null
}

# Function to stop frontend
stop_frontend() {
    print_status "Stopping frontend server..."
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID
            print_status "Frontend server stopped (PID: $FRONTEND_PID)"
        else
            print_warning "Frontend process not found"
        fi
        rm .frontend.pid
    else
        print_warning "No frontend PID file found"
    fi
    
    # Kill any remaining vite processes
    pkill -f "vite" 2>/dev/null
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    
    stop_backend
    stop_frontend
    
    print_status "All services stopped successfully!"
}

# Function to check status
check_status() {
    echo -e "${BLUE}=== Service Status ===${NC}"
    echo ""
    
    # Check backend
    if is_process_running "uvicorn app.main:app"; then
        echo -e "${GREEN}✓ Backend: Running${NC}"
        if [ -f ".backend.pid" ]; then
            BACKEND_PID=$(cat .backend.pid)
            echo "   PID: $BACKEND_PID"
        fi
    else
        echo -e "${RED}✗ Backend: Stopped${NC}"
    fi
    
    # Check frontend
    if is_process_running "vite"; then
        echo -e "${GREEN}✓ Frontend: Running${NC}"
        if [ -f ".frontend.pid" ]; then
            FRONTEND_PID=$(cat .frontend.pid)
            echo "   PID: $FRONTEND_PID"
        fi
    else
        echo -e "${RED}✗ Frontend: Stopped${NC}"
    fi
    
    echo ""
}

# Function to show logs
show_logs() {
    SERVICE=$1
    
    if [ "$SERVICE" = "backend" ]; then
        if [ -f "logs/backend.log" ]; then
            tail -f logs/backend.log
        else
            print_error "Backend log file not found"
        fi
    elif [ "$SERVICE" = "frontend" ]; then
        if [ -f "logs/frontend.log" ]; then
            tail -f logs/frontend.log
        else
            print_error "Frontend log file not found"
        fi
    else
        print_error "Please specify 'backend' or 'frontend'"
        echo "Usage: ./run.sh logs [backend|frontend]"
    fi
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_status "All dependencies installed successfully!"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd backend
    source venv/bin/activate
    
    # Run Alembic migrations if available
    if [ -f "alembic.ini" ]; then
        alembic upgrade head
    else
        print_warning "Alembic not configured. Please set up database migrations manually."
    fi
    
    cd ..
}

# Function to seed database
seed_database() {
    print_status "Seeding database with sample data..."
    
    cd backend
    source venv/bin/activate
    python ../scripts/seed/run_seed.py
    cd ..
    
    print_status "Database seeded successfully!"
}

# Function to run all Playwright tests
run_tests() {
    print_status "Running all Playwright tests..."
    
    cd frontend
    
    # Check if Playwright is installed
    if [ ! -d "node_modules/@playwright" ]; then
        print_warning "Playwright not found. Installing..."
        npm install -D @playwright/test
        npx playwright install
    fi
    
    npm test
    cd ..
    
    print_status "Tests completed!"
}

# Function to run API tests only
run_api_tests() {
    print_status "Running API tests..."
    
    cd frontend
    
    if [ ! -d "node_modules/@playwright" ]; then
        print_warning "Playwright not found. Installing..."
        npm install -D @playwright/test
        npx playwright install
    fi
    
    npm run test:api
    cd ..
    
    print_status "API tests completed!"
}

# Function to run UI tests only
run_ui_tests() {
    print_status "Running UI tests..."
    
    cd frontend
    
    if [ ! -d "node_modules/@playwright" ]; then
        print_warning "Playwright not found. Installing..."
        npm install -D @playwright/test
        npx playwright install
    fi
    
    npm run test:ui-tests
    cd ..
    
    print_status "UI tests completed!"
}

# Function to run tests with UI mode
run_tests_ui() {
    print_status "Starting Playwright test runner in UI mode..."
    
    cd frontend
    
    if [ ! -d "node_modules/@playwright" ]; then
        print_warning "Playwright not found. Installing..."
        npm install -D @playwright/test
        npx playwright install
    fi
    
    npm run test:ui
    cd ..
}

# Function to run tests in headed mode
run_tests_headed() {
    print_status "Running tests in headed mode..."
    
    cd frontend
    
    if [ ! -d "node_modules/@playwright" ]; then
        print_warning "Playwright not found. Installing..."
        npm install -D @playwright/test
        npx playwright install
    fi
    
    npm run test:headed
    cd ..
}

# Function to show test report
show_test_report() {
    print_status "Opening Playwright test report..."
    
    cd frontend
    
    if [ -f "playwright-report/index.html" ]; then
        npm run test:report
    else
        print_error "No test report found. Run tests first with './run.sh test'"
    fi
    
    cd ..
}

# Function to install Playwright browsers
install_playwright() {
    print_status "Installing Playwright browsers..."
    
    cd frontend
    
    if [ ! -d "node_modules/@playwright" ]; then
        print_warning "Playwright not found. Installing..."
        npm install -D @playwright/test
    fi
    
    npx playwright install
    cd ..
    
    print_status "Playwright browsers installed successfully!"
}

# Function to clean frontend
clean_frontend() {
    print_status "Cleaning frontend build artifacts..."
    
    cd frontend
    
    # Remove node_modules
    if [ -d "node_modules" ]; then
        print_status "Removing node_modules..."
        rm -rf node_modules
    fi
    
    # Remove dist folder
    if [ -d "dist" ]; then
        print_status "Removing dist..."
        rm -rf dist
    fi
    
    # Remove .vite cache
    if [ -d "node_modules/.vite" ]; then
        print_status "Removing .vite cache..."
        rm -rf node_modules/.vite
    fi
    
    # Remove Playwright cache
    if [ -d "node_modules/.cache" ]; then
        print_status "Removing .cache..."
        rm -rf node_modules/.cache
    fi
    
    # Remove test results
    if [ -d "test-results" ]; then
        print_status "Removing test-results..."
        rm -rf test-results
    fi
    
    if [ -d "playwright-report" ]; then
        print_status "Removing playwright-report..."
        rm -rf playwright-report
    fi
    
    cd ..
    
    print_status "Frontend cleaned successfully!"
}

# Function to clean backend
clean_backend() {
    print_status "Cleaning backend build artifacts..."
    
    cd backend
    
    # Remove virtual environment
    if [ -d "venv" ]; then
        print_status "Removing virtual environment..."
        rm -rf venv
    fi
    
    # Remove __pycache__ directories
    print_status "Removing __pycache__ directories..."
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
    
    # Remove .pyc files
    print_status "Removing .pyc files..."
    find . -type f -name "*.pyc" -delete 2>/dev/null
    
    # Remove .pytest_cache
    if [ -d ".pytest_cache" ]; then
        print_status "Removing .pytest_cache..."
        rm -rf .pytest_cache
    fi
    
    # Remove .coverage and htmlcov
    if [ -f ".coverage" ]; then
        rm -f .coverage
    fi
    if [ -d "htmlcov" ]; then
        rm -rf htmlcov
    fi
    
    cd ..
    
    print_status "Backend cleaned successfully!"
}

# Function to clean all
clean_all() {
    print_status "Cleaning all build artifacts..."
    
    clean_frontend
    clean_backend
    
    # Remove log files
    if [ -d "logs" ]; then
        print_status "Removing logs..."
        rm -rf logs/*.log
    fi
    
    # Remove PID files
    rm -f .backend.pid .frontend.pid 2>/dev/null
    
    print_status "All build artifacts cleaned successfully!"
}

# Function to build frontend for production
build_frontend() {
    print_status "Building frontend for production..."
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    npm run build
    cd ..
    
    print_status "Frontend built successfully!"
    print_status "Output: frontend/dist/"
}

# Function to rebuild frontend (clean + install)
rebuild_frontend() {
    print_status "Rebuilding frontend..."
    
    clean_frontend
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_status "Frontend rebuilt successfully!"
}

# Function to rebuild backend (clean + install)
rebuild_backend() {
    print_status "Rebuilding backend..."
    
    clean_backend
    
    print_status "Installing backend dependencies..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    
    print_status "Backend rebuilt successfully!"
}

# Function to rebuild all (clean + install)
rebuild_all() {
    print_status "Rebuilding all services..."
    
    # Stop services first
    stop_all
    
    clean_all
    
    print_status "Installing all dependencies..."
    install_deps
    
    print_status "All services rebuilt successfully!"
    print_status "Use './run.sh start' to start the services"
}

# Function to show help
show_help() {
    echo -e "${BLUE}Malar Market Digital Ledger - Server Management${NC}"
    echo ""
    echo "Usage: ./run.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start           Start all services (backend + frontend)"
    echo "  start-backend    Start only backend server"
    echo "  start-frontend   Start only frontend server"
    echo "  stop            Stop all services"
    echo "  stop-backend     Stop only backend server"
    echo "  stop-frontend    Stop only frontend server"
    echo "  restart         Restart all services"
    echo "  status          Show service status"
    echo "  logs [service]  Show logs for backend or frontend"
    echo "  install         Install all dependencies"
    echo "  migrate        Run database migrations"
    echo "  seed           Seed database with sample data"
    echo ""
    echo "Build Commands:"
    echo "  build           Build frontend for production"
    echo "  clean           Clean all build artifacts and caches"
    echo "  clean:frontend  Clean frontend (node_modules, dist, caches)"
    echo "  clean:backend   Clean backend (venv, __pycache__, .pyc)"
    echo "  rebuild         Full rebuild (clean all + reinstall)"
    echo "  rebuild:frontend Rebuild frontend only"
    echo "  rebuild:backend  Rebuild backend only"
    echo ""
    echo "Test Commands:"
    echo "  test            Run all Playwright tests"
    echo "  test:api        Run API tests only"
    echo "  test:ui         Run UI tests only"
    echo "  test:headed     Run tests in headed mode (visible browser)"
    echo "  test:runner     Run tests with Playwright UI mode"
    echo "  test:report     Open Playwright HTML test report"
    echo "  test:install    Install Playwright browsers"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh start              # Start all services"
    echo "  ./run.sh logs backend       # Show backend logs"
    echo "  ./run.sh test               # Run all tests"
    echo "  ./run.sh rebuild            # Clean and reinstall everything"
    echo "  ./run.sh build              # Build frontend for production"
    echo ""
}

# Main script logic
case "$1" in
    start)
        start_all
        ;;
    start-backend)
        start_backend
        ;;
    start-frontend)
        start_frontend
        ;;
    stop)
        stop_all
        ;;
    stop-backend)
        stop_backend
        ;;
    stop-frontend)
        stop_frontend
        ;;
    restart)
        stop_all
        sleep 2
        start_all
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs $2
        ;;
    install)
        install_deps
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    test)
        run_tests
        ;;
    test:api)
        run_api_tests
        ;;
    test:ui)
        run_ui_tests
        ;;
    test:headed)
        run_tests_headed
        ;;
    test:runner)
        run_tests_ui
        ;;
    test:report)
        show_test_report
        ;;
    test:install)
        install_playwright
        ;;
    build)
        build_frontend
        ;;
    clean)
        clean_all
        ;;
    clean:frontend)
        clean_frontend
        ;;
    clean:backend)
        clean_backend
        ;;
    rebuild)
        rebuild_all
        ;;
    rebuild:frontend)
        rebuild_frontend
        ;;
    rebuild:backend)
        rebuild_backend
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

exit 0
