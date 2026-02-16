function Card({ className = '', hover = false, children, ...rest }) {
  return (
    <div
      className={`
        bg-[#1e293b] rounded-xl border border-slate-700 p-6
        ${hover ? 'transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:shadow-black/10' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
