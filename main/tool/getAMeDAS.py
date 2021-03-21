import requests
import json
import csv

#JJWDのAPIを使用するスクリプト
#過去データがとれないため、こちらのAPIは使わないこととする
#観測所の一覧を作るためだけに使用


# 観測所の名称とIDのリスト
stations = csv.reader(open('station_name2.csv'))
csv_output_lines = ['stn_name,stn_num,stn_id,lat,lng']

for station in stations:
    stn_num = station[1]
    # JJWDへのリクエストを観測所ごとに
    response = requests.get('https://jjwd.info/api/v2/station/' + stn_num)
    ameDict = json.loads(response.text)
    stInfo = ameDict['station']
    # print(stInfo['stn_name_ja'],stInfo['stn_num'], stInfo['lat'], stInfo['lng'],stInfo['preall']['precip_daily'], stInfo['max_temp']['temp_daily_max'], stInfo['min_temp']['temp_daily_min'], stInfo['max_wind']['max_wind_daily'])
    print(station[0], station[1], station[2],stInfo['lat'], stInfo['lng'])
    csv_output_lines.append(','.join(map(lambda x:str(x), [station[0], station[1], station[2],stInfo['lat'], stInfo['lng']])))

print(csv_output_lines)

with open('station_name3.csv', mode='w') as f:
    f.write('\n'.join(csv_output_lines))


    # for station in stations:
    #     if station['stn_type'] == 'Ground':
    #         try :
    #             print(station['stn_name_ja'], ",", station['stn_num'])
    #             # print(station['stn_name_ja'],station['stn_num'], station['lat'], station['lng'],station['preall']['precip_daily'], station['max_temp']['temp_daily_max'], station['min_temp']['temp_daily_min'], station['max_wind']['max_wind_daily'])
    #         except :
    #             print(station['stn_name_ja'], 'something wrong')

            