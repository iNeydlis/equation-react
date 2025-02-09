export const Alert = ({ children, variant = "default", className = "" }) => {
    const baseStyles = "p-4 rounded-lg border mt-4";
    const variants = {
        default: "bg-gray-100 border-gray-200",
        destructive: "bg-red-100 border-red-200 text-red-800",
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};

export const AlertTitle = ({ children }) => (
    <h5 className="font-medium mb-1">{children}</h5>
);

export const AlertDescription = ({ children }) => (
    <div className="text-sm">{children}</div>
);