datatype tree = T of tree list;
val t1 = T[];
val t2 = T[t1, t1, t1];
val t3 = T[T[t2], t1, t2];
fun compareTree (T ts, T tr) = List.collate compareTree (ts,tr);

fun strict(t::t'::tr) = compareTree(t,t’)=LESS andalso strict(t’::tr)
  | strict _ = true;
fun directed (T ts) = strict ts andalso List.all directed ts;

fun eqset x y = subset x y andalso subset y x
and subset (T xs) y = List.all (fn x => member x y) xs
and member x (T ys) = List.exists (eqset x) ys;
