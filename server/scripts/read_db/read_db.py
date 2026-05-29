import pandas as pd
from server.scripts.json_safe import json_safe 
PATH_CONCRETE = r"Z:\Tier_0\06_Carbon_Rates\Process-based_Carbon_Benchmarking\Carbon_Rates_Database_R&D\app_001_epd\epd_db\1_ec3_global_concrete_rmix_data_to_app.xlsx"
PATH_STEEL = r"Z:\Tier_0\06_Carbon_Rates\Process-based_Carbon_Benchmarking\Carbon_Rates_Database_R&D\app_001_epd\epd_db\1_ec3_global_steel_epd_data_to_app.xlsx"

def read_db_test_1( path: str ): 
    # print(path)
    df = pd.read_excel(PATH_STEEL, sheet_name="Sheet1", usecols=["product", "product name", "country", "kgCO₂eq", "latitude", "longitude"]) 
    df = df.astype({"product": str, "product name": str, "country": str, "kgCO₂eq": float, "latitude": float, "longitude": float})
    df = df.rename(columns={
        "product": "Product", 
        "product name": "ProductName",
        "country": "Country",
        "kgCO₂eq": "KgCO2eq",
        "latitude": "Latitude",
        "longitude": "Longitude"
    })
    df['Latitude'] = df['Latitude'].apply(lambda x: json_safe(x))
    df['Longitude'] = df['Longitude'].apply(lambda x: json_safe(x))
    df = df.dropna(subset=["Latitude", "Longitude"]) 
    res = df.to_dict(orient="records") 
    res = [ {key: json_safe(value) for key, value in record.items()} for record in res ] 
    # print(res)

    return res

def read_db_test( path:str ): 
    df_concrete = pd.read_excel(PATH_CONCRETE, usecols=["region", "country", "material", "product", "kgCO₂eq", "latitude", "longitude"])
    df_concrete = df_concrete.astype({"region": str, "country": str, "material": str, "product": str, "kgCO₂eq": float, "latitude": float, "longitude": float})
    df_concrete = df_concrete.rename(columns={
        "region": "Region", 
        "country": "Country", 
        "material": "Material", 
        "product": "ProductName", 
        "kgCO₂eq": "KgCO2eq", 
        "latitude": "Latitude", 
        "longitude": "Longitude" 
    })
    df_steel = pd.read_excel(PATH_STEEL, usecols=["region", "country", "product", "product name", "kgCO₂eq", "latitude", "longitude"])
    df_steel = df_steel.astype({"region": str, "country": str, "product": str, "product name": str, "kgCO₂eq": float, "latitude": float, "longitude": float})
    df_steel = df_steel.rename(columns={
        "region": "Region", 
        "country": "Country", 
        "product": "Material", 
        "product name": "ProductName", 
        "kgCO₂eq": "KgCO2eq", 
        "latitude": "Latitude", 
        "longitude": "Longitude" 
    })
    df = pd.concat([df_concrete, df_steel], ignore_index=True)

    df['Latitude'] = df['Latitude'].apply(lambda x: json_safe(x))
    df['Longitude'] = df['Longitude'].apply(lambda x: json_safe(x))
    df = df.dropna(subset=["Latitude", "Longitude"]) 
    res = df.to_dict(orient="records") 
    res = [ {key: json_safe(value) for key, value in record.items()} for record in res ] 
    
    return res

def read_tree (path:str): 

    df_concrete = pd.read_excel(PATH_CONCRETE, usecols=["region", "country", "material", "product", "kgCO₂eq", "latitude", "longitude"])
    df_concrete = df_concrete.astype({"region": str, "country": str, "material": str, "product": str, "kgCO₂eq": float, "latitude": float, "longitude": float})
    df_concrete = df_concrete.rename(columns={
        "region": "Region", 
        "country": "Country", 
        "material": "Material", 
        "product": "ProductName", 
        "kgCO₂eq": "KgCO2eq", 
        "latitude": "Latitude", 
        "longitude": "Longitude" 
    })
    df_steel = pd.read_excel(PATH_STEEL, usecols=["region", "country", "product", "product name", "kgCO₂eq", "latitude", "longitude"])
    df_steel = df_steel.astype({"region": str, "country": str, "product": str, "product name": str, "kgCO₂eq": float, "latitude": float, "longitude": float})
    df_steel = df_steel.rename(columns={
        "region": "Region", 
        "country": "Country", 
        "product": "Material", 
        "product name": "ProductName", 
        "kgCO₂eq": "KgCO2eq", 
        "latitude": "Latitude", 
        "longitude": "Longitude" 
    })
    df = pd.concat([df_concrete, df_steel], ignore_index=True)

    df['Latitude'] = df['Latitude'].apply(lambda x: json_safe(x))
    df['Longitude'] = df['Longitude'].apply(lambda x: json_safe(x))
    df = df.dropna(subset=["Latitude", "Longitude"]) 
    df["KgCO2eq"] = df["KgCO2eq"].round(2) 
    out = {"name": "World", "children": []}

    for region_idx, (region, region_group) in enumerate(df.groupby("Region")):
        region_node = {
            "name": json_safe(region),
            "collapsed": False if region_idx <= 1 else True,
            "value": json_safe(region_group["KgCO2eq"].mean()),
            "children": [],
        }

        for country_idx, (country, country_group) in enumerate(region_group.groupby("Country")):
            country_node = {
                "name": json_safe(country),
                "collapsed": False if country_idx <= 1 else True,
                "value": json_safe(country_group["KgCO2eq"].mean()),
                "children": [],
            }

            for material, material_group in country_group.groupby("Material"):
                material_node = {
                    "name": json_safe(material),
                    "collapsed": True,
                    "value": json_safe(material_group["KgCO2eq"].mean()),
                    "children": [
                        {
                            "name": json_safe(row.ProductName),
                            "value": json_safe(row.KgCO2eq),
                        }
                        for row in material_group.itertuples(index=False)
                    ],
                }
                country_node["children"].append(material_node)

            region_node["children"].append(country_node)

        out["children"].append(region_node)

    return out["children"]