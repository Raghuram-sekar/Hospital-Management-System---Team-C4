A = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 'D', 1, 0, 'D', 1, 0, 'D', 1], [1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 'D', 1, 0, 'D', 1, 0, 'D', 1], [1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [1, 0, 0, 1, 0, 0, 1, 1, 1, 1], [1, 0, 0, 1, 0, 0, 1, 0, 'D', 1], [1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]
#A = [[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 'D', 1], [1, 1, 1, 1, 1]]
A = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 'D', 1, 0, 'D', 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 'D', 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1], [1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 'D', 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 'D', 1, 0, 0, 'D', 1, 1, 0, 'D', 1, 0, 'D', 1, 0, 0, 'D', 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 'D', 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 0, 'D', 1, 0, 'D', 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]

def disp(m):
    for i in range(len(m)):
        for j in range(len(m[i])):
            print(m[i][j],end=" ")
        print()

disp(A)

#Code with recursion, Has some bugs and will take O(4^n) time to run
'''
def search(A,m,n,dep,D):
    l = len(A)
    l0 = len(A[0])
    mi = l+l0
    if m<0 or n<0:
        return mi
    if dep>l+l0:
        return l+l0
    if A[m][n]==D:
        return dep
    if m+1<l and n<l0:
        if A[m+1][n]==1 or A[m+1][n]==D:
            mi = min(mi,search(A,m+1,n,dep+1,D))
    if m<l and n+1<l0:
        if A[m][n+1]==1 or A[m][n+1]==D:
            mi = min(mi,search(A,m,n+1,dep+1,D))
    if m-1<l and n<l0:
        if A[m-1][n]==1 or A[m-1][n]==D:
            mi = min(mi,search(A,m-1,n,dep+1,D))
    if m<l and n-1<l0:
        if A[m][n-1]==1 or A[m][n-1]==D:
            mi = min(mi,search(A,m,n-1,dep+1,D))
    if dep==0 and mi==l+l0:
        print(f"{D} not found")
        return False
    return mi
'''

#Code with recursion and Memoization, custom code so has flaws but still runs at O(n^3)(<<<<< 4^n) time complexity
def searchdp(A,m,n,dep,D,dp):
    l = len(A)
    l0 = len(A[0])
    mi = l+l0
    if m<0 or n<0:
        return l+l0*2
    if dep>=l+l0:
        return l+l0*2
    if dp[dep][m][n]!="N":
        return dp[dep][m][n]
    if A[m][n]==D:
        dp[dep][m][n] = dep
        return dp[dep][m][n]
    if m+1<l and n<l0:
        if A[m+1][n]==1 or A[m+1][n]==D:
            mi = min(mi,searchdp(A,m+1,n,dep+1,D,dp))
    if m<l and n+1<l0:
        if A[m][n+1]==1 or A[m][n+1]==D:
            mi = min(mi,searchdp(A,m,n+1,dep+1,D,dp))
    if m-1<l and n<l0:
        if A[m-1][n]==1 or A[m-1][n]==D:
            mi = min(mi,searchdp(A,m-1,n,dep+1,D,dp))
    if m<l and n-1<l0:
        if A[m][n-1]==1 or A[m][n-1]==D:
            mi = min(mi,searchdp(A,m,n-1,dep+1,D,dp))
    if dep==0 and mi==l+l0:
        print(f"\n{D} not found")
        dp[m][n] = -1
        return dp[dep][m][n]
    dp[dep][m][n] = mi
    return dp[dep][m][n]

dp=[[["N"]*(20) for _ in range(20)] for j in range(40)]
print(searchdp(A,6,9,0,"D",dp))

print()
#print(search(A,4,3,0,"D"))
    
    