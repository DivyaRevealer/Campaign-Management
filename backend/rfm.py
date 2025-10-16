import pandas as pd

def calculate_rfm(df):
    snapshot_date = df['InvoiceDate'].max() + pd.Timedelta(days=1)
    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda x: (snapshot_date - x.max()).days,
        'InvoiceNo': 'nunique',
        'TotalAmount': 'sum'
    })
    rfm.columns = ['Recency', 'Frequency', 'Monetary']
    rfm['R'] = pd.qcut(rfm['Recency'], 4, labels=[4, 3, 2, 1])
    rfm['F'] = pd.qcut(rfm['Frequency'].rank(method='first'), 4, labels=[1, 2, 3, 4])
    rfm['M'] = pd.qcut(rfm['Monetary'], 4, labels=[1, 2, 3, 4])
    #rfm['RFM_Score'] = rfm['R'].astype(str) + rfm['F'].astype(str) + rfm['M'].astype(str)
    rfm['RFM_Score'] = (
    rfm['R'].astype(str).replace("nan", "0") +
    rfm['F'].astype(str).replace("nan", "0") +
    rfm['M'].astype(str).replace("nan", "0")
)

    def segment(score):
        if score >= '444': return 'Champions'
        elif score >= '344': return 'Loyal'
        elif score >= '244': return 'Potential'
        elif score >= '144': return 'At Risk'
        else: return 'Lost'

    rfm['Segment'] = rfm['RFM_Score'].apply(segment)
    rfm.reset_index(inplace=True)
    return rfm
