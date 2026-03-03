import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch() {
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>
                    Đã xảy ra lỗi khi hiển thị giao diện.
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
