import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block"
    >
      <div className="overflow-hidden border border-black/10 bg-white transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ece8e0]">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <span className="absolute left-4 top-4 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
            {product.tag || product.category}
          </span>

          <div className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-3 items-center justify-center bg-black text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span aria-hidden="true">↗</span>
          </div>
        </div>

        <div className="p-5 text-black">
          <h3 className="line-clamp-1 text-sm font-bold uppercase tracking-[0.04em]">
            {product.title}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-lg font-black">
              ${product.price.toFixed(2)}
            </span>

            <span className="text-xs font-semibold text-black/50">
              ★ {product.rating}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
