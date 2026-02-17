# 🎯 Guía para Agregar Pestañas "Recientes" y "Popular" en LNReader App

## 📋 Archivos a Modificar en la App LNReader

### 1. **Ubicación del repositorio de la app**

```
https://github.com/LNReader/lnreader
```

### 2. **Archivos principales a modificar**

#### 📁 `src/screens/browse/BrowseSourceScreen.tsx`

Este es el archivo principal que muestra la interfaz cuando abres una extensión.

**Cambios necesarios:**

```typescript
import { useState } from 'react';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

// ... código existente ...

const BrowseSourceScreen = ({ route, navigation }) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'recent', title: 'Recientes' },
    { key: 'popular', title: 'Popular' },
  ]);

  // Componente para tab "Recientes"
  const RecentRoute = () => (
    <NovelList
      sourceId={sourceId}
      showLatestNovels={true}
    />
  );

  // Componente para tab "Popular"
  const PopularRoute = () => (
    <NovelList
      sourceId={sourceId}
      showLatestNovels={false}
    />
  );

  const renderScene = SceneMap({
    recent: RecentRoute,
    popular: PopularRoute,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: theme.primary }}
          style={{ backgroundColor: theme.surface }}
          labelStyle={{ color: theme.onSurface }}
        />
      )}
    />
  );
};
```

---

#### 📁 `src/components/NovelList.tsx`

Este componente muestra la lista de novelas. Debe aceptar el prop `showLatestNovels`.

**Cambios necesarios:**

```typescript
interface NovelListProps {
  sourceId: string;
  showLatestNovels?: boolean;
  filters?: any;
}

const NovelList: React.FC<NovelListProps> = ({
  sourceId,
  showLatestNovels = false,
  filters
}) => {
  const [novels, setNovels] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadNovels = async () => {
    setLoading(true);
    try {
      const plugin = await getPlugin(sourceId);
      const result = await plugin.popularNovels(page, {
        showLatestNovels,
        filters
      });
      setNovels(prev => [...prev, ...result.novels]);
    } catch (error) {
      console.error('Error loading novels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNovels();
  }, [page, showLatestNovels, filters]);

  return (
    <FlatList
      data={novels}
      renderItem={({ item }) => <NovelCard novel={item} />}
      onEndReached={() => setPage(p => p + 1)}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
};
```

---

#### 📁 `src/sources/types.ts`

Actualizar la interfaz del plugin para incluir el nuevo parámetro.

**Cambios necesarios:**

```typescript
export interface PopularNovelsOptions {
  showLatestNovels?: boolean;
  filters?: Filters;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  popularNovels(
    page: number,
    options: PopularNovelsOptions,
  ): Promise<NovelListResult>;
  // ... otros métodos
}
```

---

### 3. **Dependencias necesarias**

Si no están instaladas, agregar en `package.json`:

```json
{
  "dependencies": {
    "react-native-tab-view": "^3.5.2",
    "react-native-pager-view": "^6.2.0"
  }
}
```

Luego ejecutar:

```bash
npm install
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

---

### 4. **Estructura visual esperada**

```
┌─────────────────────────────────┐
│   NovelFire                  [X]│
├─────────────────────────────────┤
│ Recientes  │  Popular           │ ← Pestañas
├─────────────────────────────────┤
│ 📚 Shadow Slave                 │
│ 🕐 Hace 2 horas                 │
├─────────────────────────────────┤
│ 📚 Lord of Mysteries            │
│ 🕐 Hace 5 horas                 │
├─────────────────────────────────┤
│ 📚 Reverend Insanity            │
│ 🕐 Hace 1 día                   │
└─────────────────────────────────┘
```

---

## 🔧 Orden de Implementación

### Paso 1: Clonar la app

```bash
git clone https://github.com/LNReader/lnreader.git
cd lnreader
npm install
```

### Paso 2: Crear rama nueva

```bash
git checkout -b feature/recent-popular-tabs
```

### Paso 3: Modificar archivos en este orden

1. `src/sources/types.ts` (tipos)
2. `src/components/NovelList.tsx` (lógica)
3. `src/screens/browse/BrowseSourceScreen.tsx` (UI)

### Paso 4: Probar en desarrollo

```bash
# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

### Paso 5: Compilar APK

```bash
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎨 Personalización Adicional

### Agregar íconos a las pestañas

```typescript
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

<TabBar
  renderIcon={({ route, focused, color }) => (
    <Icon
      name={route.key === 'recent' ? 'clock-outline' : 'fire'}
      color={color}
      size={24}
    />
  )}
/>
```

### Mantener filtros solo en "Popular"

```typescript
const PopularRoute = () => (
  <View>
    <FilterBar onFilterChange={setFilters} />
    <NovelList
      sourceId={sourceId}
      showLatestNovels={false}
      filters={filters}
    />
  </View>
);

const RecentRoute = () => (
  <NovelList
    sourceId={sourceId}
    showLatestNovels={true}
    // Sin filtros en recientes
  />
);
```

---

## 📝 Notas Importantes

1. **Compatibilidad**: Estos cambios funcionarán con **todos los plugins** que implementen el parámetro `showLatestNovels`.

2. **Fallback**: Si un plugin no soporta `showLatestNovels`, la app debe manejarlo:

   ```typescript
   try {
     const result = await plugin.popularNovels(page, { showLatestNovels });
   } catch (error) {
     // Si falla, intentar sin el parámetro
     const result = await plugin.popularNovels(page, { filters });
   }
   ```

3. **Cache**: Considera implementar cache separado para "Recientes" y "Popular":

   ```typescript
   const cacheKey = `${sourceId}_${showLatestNovels ? 'recent' : 'popular'}_${page}`;
   ```

4. **Pull Refresh**: Agregar "pull to refresh" en ambas pestañas:
   ```typescript
   <FlatList
     refreshControl={
       <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
     }
   />
   ```

---

## 🔗 Referencias

- [React Native Tab View](https://github.com/satya164/react-native-tab-view)
- [LNReader Docs](https://github.com/LNReader/lnreader/wiki)
- [Plugin Development](https://github.com/LNReader/lnreader-plugins/blob/main/docs/docs.md)

---

## ✅ Checklist Final

- [ ] Tipos actualizados en `types.ts`
- [ ] `NovelList` acepta `showLatestNovels`
- [ ] Pestañas implementadas en `BrowseSourceScreen`
- [ ] Filtros solo en pestaña "Popular"
- [ ] Pruebas en modo desarrollo
- [ ] APK compilado y probado
- [ ] Commit y push de cambios

---

**¡Buena suerte! Si encuentras algún error o necesitas ayuda con algún archivo específico, házmelo saber.**
