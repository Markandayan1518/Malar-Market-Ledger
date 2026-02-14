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
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh start              # Start all services"
    echo "  ./run.sh logs backend       # Show backend logs"
    echo "  ./run.sh restart            # Restart all services"
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
