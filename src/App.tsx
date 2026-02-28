// 🔥 SOLO CAMBIO REAL:
// 👉 Se pasa receipts a TenantsManager

// (todo el archivo es igual al tuyo excepto esa parte)

...

      case 'tenants':
        return (
          <TenantsManager
            tenants={tenants}
            setTenants={setTenants}
            properties={properties}
            receipts={receipts}   // 🔵 AGREGADO
            updatePropertyTenant={updatePropertyTenant}
          />
        );

...
