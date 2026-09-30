-- Reduce `photoUrl` a la ruta `/uploads/<archivo>`.
--
-- Hasta ahora el endpoint de subida devolvía una URL absoluta construida con el
-- host de la petición, y esa URL quedaba guardada en la base. Al cambiar de red
-- o al abrir la app desde otro dispositivo, la foto dejaba de cargar. El
-- frontend resuelve ahora la ruta contra `NEXT_PUBLIC_API_URL`.
UPDATE `child`
SET `photoUrl` = SUBSTRING(
    `photoUrl`,
    LOCATE('/uploads/', `photoUrl`)
)
WHERE `photoUrl` LIKE 'http%://%'
  AND LOCATE('/uploads/', `photoUrl`) > 0;
